"""
Query, filter, paginate, and mutate rows in NocoDB governed datasets.
Enforces column-level masking and audit logging.
"""
from django.core.paginator import Paginator
from apps.nocodb.models import NocoDBDataset, NocoDBRowRecord, NocoDBSchemaColumn
from apps.nocodb.security import redact_phi_fields
from apps.nocodb.permissions import normalize_role
from apps.nocodb.services.audit_service import log_nocodb_audit_event


class DatasetService:
    @staticmethod
    def get_dataset_by_slug(slug: str) -> NocoDBDataset:
        return NocoDBDataset.objects.get(slug=slug, is_active=True)

    @staticmethod
    def list_accessible_datasets(user):
        """Returns datasets accessible by the user's role."""
        if not user or not user.is_authenticated:
            return NocoDBDataset.objects.none()
        if user.is_superuser:
            return NocoDBDataset.objects.filter(is_active=True)
        role = normalize_role(getattr(user, "role", ""))
        all_ds = NocoDBDataset.objects.filter(is_active=True)
        accessible_ids = []
        for ds in all_ds:
            allowed = [r.lower() for r in (ds.allowed_roles or [])]
            if role == "admin" and ("admin" in allowed or "it_admin" in allowed):
                accessible_ids.append(ds.id)
            elif role in allowed:
                accessible_ids.append(ds.id)
        return NocoDBDataset.objects.filter(id__in=accessible_ids)

    @staticmethod
    def get_dataset_schema(dataset: NocoDBDataset, user=None):
        """Returns column definitions, omitting or marking PHI columns as needed."""
        is_admin = bool(user and (user.is_superuser or normalize_role(getattr(user, "role", "")) == "admin"))
        cols = dataset.columns.all().order_by("order", "name")
        schema = []
        for c in cols:
            if c.is_phi and not is_admin:
                continue
            schema.append({
                "id": str(c.id),
                "name": c.name,
                "display_name": c.display_name,
                "column_type": c.column_type,
                "is_primary": c.is_primary,
                "is_phi": c.is_phi,
                "is_read_only": c.is_read_only,
                "options": c.options,
                "order": c.order,
            })
        return schema

    @staticmethod
    def query_rows(
        dataset: NocoDBDataset,
        user,
        page: int = 1,
        page_size: int = 25,
        sort: str = "",
        search: str = "",
        filters: dict = None,
        request=None,
    ):
        """
        Queries and filters rows in the dataset.
        """
        is_admin = bool(user and (user.is_superuser or normalize_role(getattr(user, "role", "")) == "admin"))
        qs = NocoDBRowRecord.objects.filter(dataset=dataset, is_archived=False)

        records = list(qs)

        # In-memory filtering on JSON data
        filtered = []
        search_lower = (search or "").strip().lower()

        for r in records:
            row_dict = dict(r.data or {})
            row_dict["_record_id"] = str(r.id)
            row_dict["_anon_ref_id"] = r.anon_ref_id
            row_dict["_created_at"] = r.created_at.isoformat()

            # Global search match
            if search_lower:
                values_str = " ".join(str(v).lower() for v in row_dict.values())
                if search_lower not in values_str:
                    continue

            # Column filter matches
            if filters:
                match = True
                for col, target_val in filters.items():
                    if target_val is None or target_val == "":
                        continue
                    actual_val = str(row_dict.get(col, "")).lower()
                    if str(target_val).lower() not in actual_val:
                        match = False
                        break
                if not match:
                    continue

            # Redact PHI if not admin
            redacted = redact_phi_fields(row_dict, is_admin=is_admin)
            filtered.append(redacted)

        # Sorting
        if sort:
            reverse = sort.startswith("-")
            sort_key = sort[1:] if reverse else sort
            try:
                filtered.sort(
                    key=lambda item: (item.get(sort_key) is None, item.get(sort_key)),
                    reverse=reverse,
                )
            except Exception:
                pass
        else:
            # Default sort by id or created_at
            try:
                filtered.sort(key=lambda item: item.get("id", 0), reverse=True)
            except Exception:
                pass

        # Pagination
        paginator = Paginator(filtered, max(1, min(page_size, 100)))
        current_page = paginator.get_page(page)

        # Audit log view
        log_nocodb_audit_event(
            action="VIEW",
            dataset_slug=dataset.slug,
            user=user,
            details={"search": search, "sort": sort, "rows_returned": len(current_page.object_list)},
            request=request,
        )

        return {
            "dataset_id": dataset.slug,
            "dataset_title": dataset.title,
            "category": dataset.category,
            "total_rows": paginator.count,
            "total_pages": paginator.num_pages,
            "page": current_page.number,
            "page_size": page_size,
            "schema": DatasetService.get_dataset_schema(dataset, user=user),
            "rows": current_page.object_list,
        }

    @staticmethod
    def mutate_row(dataset: NocoDBDataset, row_id: str, new_data: dict, user, request=None):
        """Updates a row's data in the dataset."""
        record = NocoDBRowRecord.objects.get(id=row_id, dataset=dataset)
        merged = dict(record.data)
        # Only update non-primary fields
        for k, v in new_data.items():
            if k not in ["id", "_record_id", "_anon_ref_id", "_created_at"]:
                merged[k] = v
        record.data = merged
        record.save(update_fields=["data", "updated_at"])

        log_nocodb_audit_event(
            action="UPDATE",
            dataset_slug=dataset.slug,
            user=user,
            resource_id=str(record.id),
            details={"updated_keys": list(new_data.keys())},
            request=request,
        )
        return record

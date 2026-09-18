package terraform.security.least_privilege

default allow = false

# Rule 1: EC2 instances must enforce IMDSv2 to prevent SSRF credential exfiltration
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_instance"
    metadata := resource.change.after.metadata_options[_]
    metadata.http_tokens != "required"
    msg := sprintf("Security Violation: EC2 instance '%v' does not require IMDSv2 (http_tokens must be 'required')", [resource.address])
}

# Rule 2: S3 Buckets must block public access
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_s3_bucket_public_access_block"
    pab := resource.change.after
    (pab.block_public_acls != true; pab.block_public_policy != true; pab.ignore_public_acls != true; pab.restrict_public_buckets != true)
    msg := sprintf("Security Violation: S3 public access block '%v' has one or more public access protections disabled", [resource.address])
}

allow {
    count(deny) == 0
}

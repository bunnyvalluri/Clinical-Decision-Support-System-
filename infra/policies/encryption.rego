package terraform.security.encryption

default allow = false

# Rule 1: S3 Buckets must enforce server-side encryption
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_s3_bucket"
    # Check if encryption configuration resource exists for this bucket
    count([enc | enc := input.resource_changes[_]; enc.type == "aws_s3_bucket_server_side_encryption_configuration"]) == 0
    msg := sprintf("HIPAA Violation: S3 Bucket '%v' lacks required server-side encryption configuration", [resource.address])
}

# Rule 2: EBS volumes must be encrypted
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_instance"
    root_block := resource.change.after.root_block_device[_]
    root_block.encrypted != true
    msg := sprintf("HIPAA Violation: EC2 instance '%v' root volume is not encrypted", [resource.address])
}

allow {
    count(deny) == 0
}

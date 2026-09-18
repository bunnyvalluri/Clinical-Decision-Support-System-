package terraform.security.network

default allow = false

# Rule: Ingress to sensitive internal ports must never be 0.0.0.0/0
forbidden_ports := [22, 6379, 7700, 8000, 11434]

deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_security_group"
    ingress := resource.change.after.ingress[_]
    port := ingress.from_port
    forbidden_ports[_] == port
    cidr := ingress.cidr_blocks[_]
    cidr == "0.0.0.0/0"
    msg := sprintf("HIPAA Violation: Security group '%v' exposes sensitive port %v directly to 0.0.0.0/0", [resource.address, port])
}

allow {
    count(deny) == 0
}

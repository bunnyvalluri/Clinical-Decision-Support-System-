# HealthNova AI CDSS — Networking Module (OpenTofu)
# Multi-AZ Segregated VPC Architecture: Public (Web), App Private, Data Private

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name        = "${var.environment}-healthnova-vpc"
    Environment = var.environment
    Compliance  = "HIPAA-Security-Rule"
  })
}

# Internet Gateway for Public Web Ingress
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.environment}-healthnova-igw"
  })
}

# Public Subnets (Nginx Ingress / ALB)
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.environment}-public-subnet-${count.index + 1}"
    Tier = "public"
  })
}

# App Private Subnets (Django ASGI, Celery Workers)
resource "aws_subnet" "app_private" {
  count             = length(var.app_private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.app_private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-app-private-subnet-${count.index + 1}"
    Tier = "app-private"
  })
}

# Data Private Subnets (Redis, Meilisearch, Ollama)
resource "aws_subnet" "data_private" {
  count             = length(var.data_private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.data_private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-data-private-subnet-${count.index + 1}"
    Tier = "data-private"
  })
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

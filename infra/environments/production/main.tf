terraform {
  required_version = ">= 1.8.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }

  backend "s3" {
    bucket         = "healthnova-production-tofu-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "healthnova-production-tofu-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "HealthNova-AI"
      Environment = "production"
      ManagedBy   = "OpenTofu"
      Compliance  = "HIPAA-HITECH-SOC2"
      Repository  = "bunnyvalluri/Clinical-Decision-Support-System-"
    }
  }
}

# 1. Isolated Networking Tier (VPC, Subnets, NAT Gateways)
module "networking" {
  source = "../../modules/networking"

  vpc_cidr             = var.vpc_cidr
  environment          = "production"
  project_name         = "healthnova"
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  app_subnet_cidrs     = ["10.0.10.0/24", "10.0.11.0/24"]
  data_subnet_cidrs    = ["10.0.20.0/24", "10.0.21.0/24"]
  enable_nat_gateway   = true
  single_nat_gateway   = false # Multi-AZ redundancy for production DR
}

# 2. Hardened Network Security Groups
module "firewall" {
  source = "../../modules/firewall"

  vpc_id            = module.networking.vpc_id
  environment       = "production"
  project_name      = "healthnova"
  admin_cidr_blocks = var.admin_cidr_blocks
}

# 3. Encrypted Object Storage for DR Backups & Artifacts
module "storage_backups" {
  source = "../../modules/storage"

  bucket_name_prefix = "healthnova"
  bucket_suffix      = "production-dr-backups"
  environment        = "production"
  transition_to_ia_days              = 30
  noncurrent_version_expiration_days = 365
}

# 4. Hardened Application & Coolify Host VM
module "server" {
  source = "../../modules/server"

  project_name        = "healthnova"
  environment         = "production"
  instance_type       = var.instance_type
  subnet_id           = module.networking.app_subnet_ids[0]
  security_group_ids  = [module.firewall.app_security_group_id]
  root_volume_size_gb = 100
  key_name            = var.key_name
}

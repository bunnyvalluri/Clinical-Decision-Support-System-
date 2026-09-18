terraform {
  required_version = ">= 1.8.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }

  backend "s3" {
    bucket         = "healthnova-staging-tofu-state"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "healthnova-staging-tofu-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "HealthNova-AI"
      Environment = "staging"
      ManagedBy   = "OpenTofu"
      Compliance  = "HIPAA-HITECH-SOC2"
      Repository  = "bunnyvalluri/Clinical-Decision-Support-System-"
    }
  }
}

module "networking" {
  source = "../../modules/networking"

  vpc_cidr             = var.vpc_cidr
  environment          = "staging"
  project_name         = "healthnova"
  public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
  app_subnet_cidrs     = ["10.1.10.0/24", "10.1.11.0/24"]
  data_subnet_cidrs    = ["10.1.20.0/24", "10.1.21.0/24"]
  enable_nat_gateway   = true
  single_nat_gateway   = true
}

module "firewall" {
  source = "../../modules/firewall"

  vpc_id            = module.networking.vpc_id
  environment       = "staging"
  project_name      = "healthnova"
  admin_cidr_blocks = var.admin_cidr_blocks
}

module "storage_backups" {
  source = "../../modules/storage"

  bucket_name_prefix = "healthnova"
  bucket_suffix      = "staging-dr-backups"
  environment        = "staging"
  transition_to_ia_days              = 30
  noncurrent_version_expiration_days = 90
}

module "server" {
  source = "../../modules/server"

  project_name        = "healthnova"
  environment         = "staging"
  instance_type       = var.instance_type
  subnet_id           = module.networking.app_subnet_ids[0]
  security_group_ids  = [module.firewall.app_security_group_id]
  root_volume_size_gb = 50
  key_name            = var.key_name
}

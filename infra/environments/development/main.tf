terraform {
  required_version = ">= 1.8.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "HealthNova-AI"
      Environment = "development"
      ManagedBy   = "OpenTofu"
    }
  }
}

module "networking" {
  source = "../../modules/networking"

  vpc_cidr             = var.vpc_cidr
  environment          = "development"
  project_name         = "healthnova"
  public_subnet_cidrs  = ["10.2.1.0/24"]
  app_subnet_cidrs     = ["10.2.10.0/24"]
  data_subnet_cidrs    = ["10.2.20.0/24"]
  enable_nat_gateway   = false # Cost saving in dev
  single_nat_gateway   = true
}

module "firewall" {
  source = "../../modules/firewall"

  vpc_id            = module.networking.vpc_id
  environment       = "development"
  project_name      = "healthnova"
  admin_cidr_blocks = var.admin_cidr_blocks
}

module "storage_backups" {
  source = "../../modules/storage"

  bucket_name_prefix = "healthnova"
  bucket_suffix      = "dev-dr-backups"
  environment        = "development"
  transition_to_ia_days              = 30
  noncurrent_version_expiration_days = 30
}

module "server" {
  source = "../../modules/server"

  project_name        = "healthnova"
  environment         = "development"
  instance_type       = var.instance_type
  subnet_id           = module.networking.public_subnet_ids[0]
  security_group_ids  = [module.firewall.app_security_group_id]
  root_volume_size_gb = 30
  key_name            = var.key_name
}

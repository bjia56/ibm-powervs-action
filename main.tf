locals {
  resource_group_name = "${var.prefix}-resource-group"
  workspace_name      = "${var.prefix}-workspace"
  ssh_key_name        = "${var.prefix}-pi-ssh-key"
  instance_name       = "${var.prefix}-instance"
}

module "resource_group" {
  source  = "terraform-ibm-modules/resource-group/ibm"
  version = "1.3.0"

  resource_group_name = local.resource_group_name
}

resource "tls_private_key" "ssh_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

module "powervs_workspace" {
  source     = "terraform-ibm-modules/powervs-workspace/ibm"
  version    = "3.2.1"
  depends_on = [module.resource_group]

  pi_zone                 = var.powervs_zone
  pi_resource_group_name  = module.resource_group.resource_group_name
  pi_workspace_name       = local.workspace_name
  pi_ssh_public_key       = {
    name  = local.ssh_key_name
    value = tls_private_key.ssh_key.public_key_openssh
  }
  pi_public_subnet_enable = true
}

data "ibm_pi_catalog_images" "catalog_images_ds" {
  pi_cloud_instance_id = module.powervs_workspace.pi_workspace_guid
  sap                  = false
  vtl                  = false
}

locals {
  catalog_images = {
    for stock_image in data.ibm_pi_catalog_images.catalog_images_ds.images :
    stock_image.name => stock_image.image_id
  }
}

module "pi_instance" {
  source     = "terraform-ibm-modules/powervs-instance/ibm"
  version    = "2.7.0"
  depends_on = [module.powervs_workspace]

  pi_workspace_guid = module.powervs_workspace.pi_workspace_guid
  pi_ssh_public_key_name     = local.ssh_key_name
  pi_image_id                = lookup(local.catalog_images, var.powervs_os_image_name, null)
  pi_networks                = [module.powervs_workspace.pi_public_subnet]
  pi_instance_name           = local.instance_name
  pi_boot_image_storage_tier = var.powervs_boot_image_storage_tier
  pi_server_type             = var.powervs_server_type
  pi_number_of_processors    = var.powervs_number_of_processors
  pi_memory_size             = var.powervs_memory_size
  pi_cpu_proc_type           = var.powervs_cpu_proc_type
  pi_user_data               = var.powervs_user_data
}
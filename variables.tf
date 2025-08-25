variable "ibmcloud_api_key" {
  type        = string
  description = "The IBM Cloud API Key"
  sensitive   = true
}

variable "powervs_zone" {
  description = "IBM Cloud PowerVS zone."
  type        = string
  default     = "us-south"
  validation {
    condition     = contains(["syd04", "syd05", "eu-de-1", "eu-de-2", "lon04", "lon06", "tok04", "us-east", "us-south", "dal10", "dal12", "dal14", "tor01", "osa21", "sao01", "sao04", "mon01", "wdc06", "wdc07", "che01", "mad02", "mad04"], var.powervs_zone)
    error_message = "Only Following DC values are supported :  syd04, syd05, eu-de-1, eu-de-2, lon04, lon06, tok04, us-east, us-south, dal10, dal12, dal14, tor01, osa21, sao01, sao04, mon01, wdc06, wdc07,che01, mad02, mad04"
  }
}

variable "prefix" {
  description = "Prefix for resources which will be created."
  type        = string
  default     = "ibm-powervs-action"
}

variable "powervs_user_data" {
  description = "The user data cloud-init to pass to the instance during creation. It can be a base64 encoded or an unencoded string. If it is an unencoded string, the provider will encode it before it passing it down."
  type        = string
  default     = null
  sensitive   = true
}

variable "powervs_os_image_name" {
  description = "Image Name for PowerVS Instance."
  type        = string
  default     = "7200-05-09"
}

variable "powervs_boot_image_storage_tier" {
  description = "Storage type for server deployment.Possible values tier0, tier1 and tier3"
  type        = string
  default     = "tier1"
}

variable "powervs_server_type" {
  description = "The type of system on which to create the VM. Supported values are e980/s922/e1080/s1022. Required when not creating SAP instances. Conflicts with 'powervs_sap_profile_id'."
  type        = string
  default     = "s1022"
}

variable "powervs_cpu_proc_type" {
  description = "The type of processor mode in which the VM will run with shared, capped or dedicated. Required when not creating SAP instances. Conflicts with 'powervs_sap_profile_id'."
  type        = string
  default     = "shared"
}

variable "powervs_number_of_processors" {
  description = "The number of vCPUs to assign to the VM as visible within the guest Operating System. Required when not creating SAP instances. Conflicts with 'powervs_sap_profile_id'."
  type        = string
  default     = 2
}

variable "powervs_memory_size" {
  description = "The amount of memory that you want to assign to your instance in GB. Required when not creating SAP instances. Conflicts with 'powervs_sap_profile_id'."
  type        = string
  default     = 4
}
# IBM PowerVS Action

A GitHub Action that provisions virtual machines on IBM PowerVS cloud.

## Features

- ✅ Provision VMs on IBM PowerVS using OpenTofu
- 🔑 Ephemeral SSH key generation and configuration
- 🧹 Automatic resource cleanup after workflow completion
- ⚙️ Configurable VM specifications (CPU, memory, OS image)
- 📝 Optional user data script execution

## Usage

### Basic Example

```yaml
name: Run on IBM PowerVS
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Provision PowerVS VM
        uses: bjia56/ibm-powervs-action@main
        with:
          ibmcloud_api_key: ${{ secrets.IBMCLOUD_API_KEY }}
          zone: us-south

      - name: Connect and run commands
        shell: powervs {0}
        run: |
          whoami && uptime
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `ibmcloud_api_key` | IBM Cloud API Key | ✅ Yes | - |
| `zone` | IBM Cloud PowerVS zone | No | `us-south` |
| `prefix` | Prefix for resource names | No | `github-actions` |
| `os_image_name` | OS image name | No | `7200-05-09` |
| `server_type` | PowerVS server type | No | `s1022` |
| `number_of_processors` | Number of processors | No | `2` |
| `memory_size` | Memory size in GB | No | `4` |
| `user_data` | User data script | No | - |

## Outputs

The action automatically configures SSH access to the provisioned VM:

- **SSH Hostname**: `powervs`
- **SSH User**: `root`
- **Connection**: `ssh powervs`
- **Custom GitHub Actions Shell**: `powervs {0}`

## Cleanup

Resources are automatically cleaned up after the workflow completes, regardless of success or failure. The cleanup process:

1. Destroys all provisioned infrastructure
2. Removes temporary files

## Security Notes

- SSH keys are generated dynamically and cleaned up automatically
- API keys should always be stored in GitHub Secrets

## License

This project is licensed under the MIT License - see the LICENSE file for details.

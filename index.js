const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function main() {
  try {
    // Get input parameters
    const ibmcloudApiKey = core.getInput('ibmcloud_api_key');
    const powervs_zone = core.getInput('zone');
    const prefix = core.getInput('prefix');
    const powervs_os_image_name = core.getInput('os_image_name');
    const powervs_server_type = core.getInput('server_type');
    const powervs_number_of_processors = core.getInput('number_of_processors');
    const powervs_memory_size = core.getInput('memory_size');
    const powervs_user_data = core.getInput('user_data');

    core.info('🚀 Starting IBM PowerVS VM provisioning...');

    // Setup OpenTofu
    core.info('⚙️  Setting up OpenTofu...');
    await exec.exec('bash', ['-c', 'curl --proto "=https" --tlsv1.2 -fsSL https://get.opentofu.org/install-opentofu.sh -o install-opentofu.sh']);
    fs.chmodSync('install-opentofu.sh', '755');
    await exec.exec('bash', ['-c', './install-opentofu.sh --install-method standalone']);

    // Initialize OpenTofu
    core.info('🔧 Initializing OpenTofu...');
    await exec.exec('tofu', ['init']);

    // Plan infrastructure
    core.info('📋 Planning infrastructure...');
    const planArgs = [
      'plan',
      `-var=ibmcloud_api_key=${ibmcloudApiKey}`,
      `-var=powervs_zone=${powervs_zone}`,
      `-var=prefix=${prefix}`,
      `-var=powervs_os_image_name=${powervs_os_image_name}`,
      `-var=powervs_server_type=${powervs_server_type}`,
      `-var=powervs_number_of_processors=${powervs_number_of_processors}`,
      `-var=powervs_memory_size=${powervs_memory_size}`,
      '-out=tfplan'
    ];

    // Add powervs_user_data if provided, base64-encoded
    if (powervs_user_data && powervs_user_data.trim()) {
      const encodedUserData = Buffer.from(powervs_user_data).toString('base64');
      planArgs.splice(-1, 0, `-var=powervs_user_data=${encodedUserData}`);
    }
    await exec.exec('tofu', planArgs);

    // Apply infrastructure
    core.info('🏗️  Applying infrastructure...');
    await exec.exec('tofu', ['apply', '-auto-approve', 'tfplan']);

    // Extract outputs from tfstate
    core.info('📤 Extracting outputs from tfstate...');

    function findValueInObject(obj, key) {
      for (const prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          if (prop === key) {
            return obj[prop];
          } else if (typeof obj[prop] === 'object' && obj[prop] !== null) {
            const result = findValueInObject(obj[prop], key);
            if (result !== undefined) {
              return result;
            }
          }
        }
      }
      return undefined;
    }

    // Read tfstate file
    const tfstatePath = path.join(process.cwd(), 'terraform.tfstate');
    if (!fs.existsSync(tfstatePath)) {
      throw new Error('terraform.tfstate file not found');
    }

    const tfstateContent = fs.readFileSync(tfstatePath, 'utf8');
    const tfstate = JSON.parse(tfstateContent);

    // Extract external_ip and private_key_openssh
    const vmIp = findValueInObject(tfstate, 'external_ip');
    const sshKey = findValueInObject(tfstate, 'private_key_openssh');

    if (!vmIp) {
      throw new Error('external_ip not found in tfstate');
    }
    if (!sshKey) {
      throw new Error('private_key_openssh not found in tfstate');
    }

    // Setup SSH configuration
    core.info('🔑 Setting up SSH configuration...');
    const homeDir = os.homedir();
    const sshDir = path.join(homeDir, '.ssh');
    const sshKeyPath = path.join(sshDir, 'powervs_key');
    const sshConfigPath = path.join(sshDir, 'config');

    // Create SSH directory if it doesn't exist
    if (!fs.existsSync(sshDir)) {
      fs.mkdirSync(sshDir, { mode: 0o700 });
    }

    // Write SSH private key
    fs.writeFileSync(sshKeyPath, sshKey, { mode: 0o600 });

    // Add SSH config entry
    const sshConfigEntry = `
Host powervs
  HostName ${vmIp}
  User root
  IdentityFile ${sshKeyPath}
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
  LogLevel ERROR
`;

    fs.appendFileSync(sshConfigPath, sshConfigEntry);

    // Create custom shell script
    core.info('🔧 Setting up custom shell...');
    const binDir = path.join(homeDir, '.local', 'bin');
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    const shellScript = `#!/usr/bin/env sh
ssh powervs sh -l <\$1
`;
    const shellScriptPath = path.join(binDir, 'powervs');
    fs.writeFileSync(shellScriptPath, shellScript, { mode: 0o755 });

    // Store state information for cleanup
    const stateInfo = {
      ibmcloud_api_key: ibmcloudApiKey,
      powervs_zone: powervs_zone,
      prefix: prefix,
      powervs_os_image_name: powervs_os_image_name,
      powervs_server_type: powervs_server_type,
      powervs_number_of_processors: powervs_number_of_processors,
      powervs_memory_size: powervs_memory_size,
      powervs_user_data: powervs_user_data,
      working_directory: process.cwd()
    };
    fs.writeFileSync('.cleanup-state.json', JSON.stringify(stateInfo, null, 2));

    core.info('✅ VM provisioned successfully!');
    core.info(`📡 IP Address: ${vmIp}`);
    core.info('🔑 SSH access configured as "powervs" hostname');
    core.info('🚀 You can now connect using: ssh powervs');
    core.info('🐚 Custom shell "powervs" available for direct command execution');

  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

main();
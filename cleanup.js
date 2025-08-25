const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');

// Ensure we run in the action's repo directory
process.chdir(__dirname);

async function cleanup() {
  try {
    core.info('🧹 Starting cleanup process...');

    // Check if cleanup state file exists
    const stateFile = '.cleanup-state.json';
    if (!fs.existsSync(stateFile)) {
      core.info('ℹ️  No cleanup state found, skipping cleanup');
      return;
    }

    // Read cleanup state
    const stateContent = fs.readFileSync(stateFile, 'utf8');
    const state = JSON.parse(stateContent);

    // Change to the original working directory
    process.chdir(state.working_directory);

    core.info('🔧 Running OpenTofu destroy...');

    // Run tofu destroy
    const destroyArgs = [
      'destroy',
      '-auto-approve',
      `-var=ibmcloud_api_key=${state.ibmcloud_api_key}`,
      `-var=powervs_zone=${state.powervs_zone}`,
      `-var=prefix=${state.prefix}`,
      `-var=powervs_os_image_name=${state.powervs_os_image_name}`,
      `-var=powervs_server_type=${state.powervs_server_type}`,
      `-var=powervs_number_of_processors=${state.powervs_number_of_processors}`,
      `-var=powervs_memory_size=${state.powervs_memory_size}`
    ];

    // Add powervs_user_data if it was provided during creation
    if (state.powervs_user_data && state.powervs_user_data.trim()) {
      const encodedUserData = Buffer.from(state.powervs_user_data).toString('base64');
      destroyArgs.push(`-var=powervs_user_data=${encodedUserData}`);
    }

    await exec.exec('tofu', destroyArgs);

    // Clean up state file
    fs.unlinkSync(stateFile);

    core.info('✅ Cleanup completed successfully!');

  } catch (error) {
    core.warning(`Cleanup failed: ${error.message}`);
    // Don't fail the entire workflow if cleanup fails
    core.info('⚠️  Cleanup failure will not fail the workflow');
  }
}

cleanup();
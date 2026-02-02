function createGroupId(name) {
  const sanitized = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/[-._]{2,}/g, '_');
  
  // Create a simple but effective hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  
  // Convert hash to alphanumeric string
  const hashStr = Math.abs(hash).toString(36);
  
  // Combine: prefix (max 12 chars) + underscore + hash (remaining space)
  const prefix = sanitized.slice(0, 12);
  const suffix = hashStr.slice(0, 7);
  
  let result = prefix + '_' + suffix;
  
  // Ensure it's exactly 20 chars
  if (result.length > 20) {
    result = result.slice(0, 20);
  } else {
    result = result.padEnd(20, '0');
  }
  
  // Final cleanup to ensure no double special chars
  return result.replace(/[-._]{2,}/g, '_');
}
module.exports = { createGroupId };
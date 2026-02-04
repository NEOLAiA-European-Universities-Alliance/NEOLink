function transformString(str) {
  return str
    .toLowerCase()
    .replace(/:/g, '')
    .replace(/[(),/\s]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

module.exports = { transformString };
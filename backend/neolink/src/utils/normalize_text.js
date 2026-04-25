function tryFixMojibake(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return value;
  }

  // Typical UTF-8 interpreted as Latin-1 artifacts (e.g. "SlavomÃ­ra").
  const likelyMojibake = /Ã|Â|Ð|Ñ|Ä|Å|Æ|Ø|Þ|ß|¢|£|¤|¥|¦|§|¨|©|ª|«|¬|®|¯|°|±|²|³|´|µ|¶|·|¸|¹|º|»|¼|½|¾|¿/.test(value);
  if (!likelyMojibake) {
    return value;
  }

  try {
    const decoded = Buffer.from(value, 'latin1').toString('utf8');
    if (!decoded || decoded.includes('\uFFFD')) {
      return value;
    }
    return decoded;
  } catch (error) {
    return value;
  }
}

function stripDiacritics(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function toAsciiText(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(/\u2019/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x00-\x7F]/g, '');
}

function normalizePersonName(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const fixed = tryFixMojibake(value);
  return toAsciiText(stripDiacritics(fixed)).replace(/\s+/g, ' ').trim();
}

module.exports = { normalizePersonName };
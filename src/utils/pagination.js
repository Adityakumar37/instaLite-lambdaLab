function parsePagination(query) {
  const isPositiveInt = (val) => /^[1-9]\d*$/.test(String(val));

  if (query.page !== undefined && !isPositiveInt(query.page)) {
    return { error: "page and limit must be positive integers" };
  }

  if (query.limit !== undefined && !isPositiveInt(query.limit)) {
    return { error: "page and limit must be positive integers" };
  }

  const page = query.page ? parseInt(query.page, 10) : 1;
  let limit = query.limit ? parseInt(query.limit, 10) : 10;

  if (limit > 50) {
    limit = 50;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip, take: limit };
}

function formatMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
  };
}

module.exports = {
  parsePagination,
  formatMeta,
};

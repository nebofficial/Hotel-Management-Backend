function groupByModule(permissions = []) {
  const modules = {};
  (permissions || []).forEach((p) => {
    const [mod, page, action] = String(p).split(':');
    const modKey = mod || 'General';
    if (!modules[modKey]) modules[modKey] = {};
    const pageKey = page || 'All';
    if (!modules[modKey][pageKey]) modules[modKey][pageKey] = new Set();
    if (action) modules[modKey][pageKey].add(action);
  });
  const result = [];
  Object.entries(modules).forEach(([mod, pages]) => {
    const pageList = [];
    Object.entries(pages).forEach(([page, actions]) => {
      pageList.push({
        page,
        actions: Array.from(actions),
      });
    });
    result.push({ module: mod, pages: pageList });
  });
  return result;
}

function flattenMatrix(matrix = []) {
  const perms = [];
  (matrix || []).forEach((m) => {
    (m.pages || []).forEach((p) => {
      if (!p.actions || !p.actions.length) {
        perms.push(`${m.module}:${p.page}`);
      } else {
        p.actions.forEach((a) => {
          perms.push(`${m.module}:${p.page}:${a}`);
        });
      }
    });
  });
  return perms;
}

module.exports = {
  groupByModule,
  flattenMatrix,
};


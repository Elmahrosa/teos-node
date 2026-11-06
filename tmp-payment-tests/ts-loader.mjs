export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {}
  }
  return nextResolve(specifier, context);
}

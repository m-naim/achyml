export function extractStyleFromYaml(yamlText: string): any {
  try {
    // @ts-ignore
    const yaml = window.jsyaml || null;
    if (yaml) {
      const doc = yaml.load(yamlText);
      return doc?.style ?? {};
    }
    return {};
  } catch {
    return {};
  }
}

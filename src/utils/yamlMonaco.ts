export function setupYamlMonacoSchema(schema: any) {
  // @ts-ignore
  if (window.monaco && window.monaco.languages?.yaml) {
    // @ts-ignore
    window.monaco.languages.yaml.yamlDefaults.setDiagnosticsOptions({
      enableSchemaRequest: true,
      validate: true,
      schemas: [
        {
          uri: "inmemory://model-schema.json",
          fileMatch: ["*"],
          schema: schema
        }
      ],
      completion: true,
      format: true,
      hover: true,
      schemaValidation: "error",
      enableCompletion: true,
      enableHover: true
    });
  }
}

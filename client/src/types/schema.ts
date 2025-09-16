export type StatusSchema = {
  label: string
  type: "status" | "select"
  options: string[]
}

export type PropertySchema = {
  label: string
  type?: string
  options?: string[]
}

export type SchemaInfo = {
  databaseId?: string
  dataSourceId?: string
  title?: string
  properties: {
    title?: PropertySchema
    schedule?: PropertySchema
    status?: StatusSchema
    tags?: PropertySchema
    url?: PropertySchema
  }
}

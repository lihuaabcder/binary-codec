export enum ValidationLevel {
  FATAL = 'fatal', // Throw error, stop execution
  ERROR = 'error', // Log error, may affect result
  WARNING = 'warning', // Warning, doesn't affect functionality
  INFO = 'info' // Information only
}

export type ValidationResult = {
  level: ValidationLevel
  message: string
  path: string // Error field path, e.g. "fields[0].map.flag"
  code: string // Error code for programmatic handling
};

export type ValidationOptions = {
  validate?: boolean // Default: true in dev, false in prod
  onValidation?: (results: ValidationResult[]) => void
  throwOnFatal?: boolean // Default: true
};

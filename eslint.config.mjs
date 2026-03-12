import nextConfig from "eslint-config-next"

const baseIgnores = ["node_modules", ".next", "dist"]

export default [{ ignores: baseIgnores }, ...nextConfig]

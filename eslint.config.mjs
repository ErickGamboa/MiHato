import nextConfig from "eslint-config-next"

const baseIgnores = ["node_modules", ".next", "dist"]
const config = [{ ignores: baseIgnores }, ...nextConfig]

export default config

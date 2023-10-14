import typescript from "@rollup/plugin-typescript";
import { terser } from 'rollup-plugin-terser' // 压缩
import pkg from './package.json' assert { type: 'json'}

export default {
  input: './magicDrag/index.ts',
  output: [
    // {
    //   format: 'cjs',
    //   file: pkg.main
    // },
    {
      format: 'es',
      file: pkg.module
    }
  ],
  plugins: [typescript(), terser()]
}

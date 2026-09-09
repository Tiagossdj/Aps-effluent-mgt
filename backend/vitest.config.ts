import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    // Vários arquivos de teste de controller/repository compartilham a
    // mesma tabela `analyses` no Postgres de teste e fazem
    // `DELETE FROM analyses` no `afterEach` — com arquivos rodando em
    // paralelo (padrão do Vitest), um arquivo pode limpar a tabela no
    // meio de outro, causando falhas intermitentes. Desativar o
    // paralelismo entre arquivos torna a suíte determinística.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/test/**"],
      // Threshold conservador sobre o agregado do projeto (não por
      // arquivo) — falha `pnpm test -- --coverage` se a cobertura cair
      // abaixo disso, sem travar contribuições legítimas com um número
      // otimista demais.
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});

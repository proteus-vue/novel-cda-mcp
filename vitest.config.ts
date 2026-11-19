import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    // store/config 在模块加载时读 env；测试里用 vi.resetModules + 动态 import，单进程避免 env 串扰
    pool: "forks",
    maxWorkers: 1,
    minWorkers: 1,
  },
});

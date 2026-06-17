#!/usr/bin/env node
/**
 * 结局猎手 v2
 *
 * 对每个结局，生成一份专属 GOLDEN_KEYWORDS，然后复用 golden runner 的流程引擎。
 * 跑完后检查结局是否到达、目标 flags 是否匹配。
 */

import { execSync } from 'child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const RUNNER = path.join(ROOT, 'tools/game-flow-runner.mjs');

// 结局专属关键词表：每个结局一组关键词，优先级→步骤顺序
const ENDING_ROUTES = {
  end_refuse: {
    title: '雨声不停',
    keywords: ['不接', '这个案子我不接', '拒接'],
    target_scene: 'end_refuse',
  },
  end_archive: {
    title: '无声归档',
    keywords: ['先问几个问题', '委托我接了', '圣约翰大学', '问舍监', '门房', '论文草稿', '去下一个地方', '巡捕房', '卷宗', '王巡官', '薛华立路', '周围观察', '跟踪', '沈玉兰', '203', '搜查', '地图', '光华小学', '陈老师', '苏晚亭关系', '异常', '办公室', '信', '吴校长', '恐吓信', '合影', '日记', '合到一起', '推理陈明远之死', '当铺', '翡翠镯', '周怀安', '继续拿出', '黑衣男人', '老孙', '支援', '福生仓', '封起', '归档', '证据不足'],
    target_scene: 'end_archive',
  },
  end_boss_lu: {
    title: '面具之下（指认陆）',
    keywords: ['先问几个问题', '委托我接了', '圣约翰大学', '问舍监', '门房', '论文草稿', '去下一个地方', '巡捕房', '卷宗', '王巡官', '薛华立路', '周围观察', '跟踪', '沈玉兰', '203', '搜查', '地图', '光华小学', '陈老师', '苏晚亭关系', '异常', '办公室', '信', '吴校长', '恐吓信', '合影', '日记', '合到一起', '推理陈明远之死', '当铺', '翡翠镯', '周怀安', '继续拿出', '黑衣男人', '老孙', '福生仓', '指认', '陆小姐'],
    target_scene: 'end_boss_lu',
  },
  end_boss_zhao: {
    title: '提线木偶（指认赵）',
    keywords: ['先问几个问题', '委托我接了', '圣约翰大学', '问舍监', '门房', '论文草稿', '去下一个地方', '巡捕房', '卷宗', '王巡官', '薛华立路', '周围观察', '跟踪', '沈玉兰', '203', '搜查', '地图', '光华小学', '陈老师', '苏晚亭关系', '异常', '办公室', '信', '吴校长', '恐吓信', '合影', '日记', '合到一起', '推理陈明远之死', '当铺', '翡翠镯', '周怀安', '继续拿出', '黑衣男人', '老孙', '福生仓', '指认', '黑衣'],
    target_scene: 'end_boss_zhao',
  },
  end_boss_wu: {
    title: '师者无声（指认吴）',
    keywords: ['先问几个问题', '委托我接了', '圣约翰大学', '问舍监', '门房', '论文草稿', '去下一个地方', '巡捕房', '卷宗', '王巡官', '薛华立路', '周围观察', '跟踪', '沈玉兰', '203', '搜查', '地图', '光华小学', '陈老师', '苏晚亭关系', '异常', '办公室', '信', '吴校长', '恐吓信', '合影', '日记', '合到一起', '推理陈明远之死', '当铺', '翡翠镯', '周怀安', '继续拿出', '黑衣男人', '老孙', '福生仓', '指认', '吴校长'],
    target_scene: 'end_boss_wu',
  },
  end_too_late: {
    title: '迟到一步（超时）',
    keywords: ['先问几个问题', '委托我接了', '圣约翰大学', '问舍监', '门房', '论文草稿', '去下一个地方', '苏家', '看她母亲', '薛华立路', '周围观察', '跟踪', '沈玉兰', '203', '搜查', '光华小学', '推理陈明远之死', '当铺', '翡翠镯', '周怀安', '推理黑衣男人', '老孙', '福生仓', '自然收束'],
    target_scene: 'end_too_late',
  },
  end_rescue: {
    title: '黎明灯火（救援）',
    keywords: ['先问几个问题', '委托我接了', '圣约翰大学', '问舍监', '门房', '论文草稿', '去下一个地方', '巡捕房', '卷宗', '王巡官', '薛华立路', '周围观察', '跟踪', '沈玉兰', '203', '搜查', '地图', '光华小学', '陈老师', '苏晚亭关系', '异常', '办公室', '信', '吴校长', '恐吓信', '合影', '日记', '合到一起', '推理陈明远之死', '当铺', '翡翠镯', '周怀安', '继续拿出', '黑衣男人', '老孙', '支援', '福生仓', '带她离开', '医院', '陆念薇', '傅启元', '自然收束'],
    target_scene: 'end_rescue',
  },
  end_conspiracy: {
    title: '迷雾未尽（普通真相）',
    keywords: ['先问几个问题', '委托我接了', '圣约翰大学', '问舍监', '门房', '论文草稿', '去下一个地方', '巡捕房', '卷宗', '王巡官', '薛华立路', '周围观察', '跟踪', '沈玉兰', '203', '搜查', '地图', '光华小学', '陈老师', '苏晚亭关系', '异常', '办公室', '信', '吴校长', '恐吓信', '合影', '日记', '合到一起', '推理陈明远之死', '当铺', '翡翠镯', '周怀安', '继续拿出', '黑衣男人', '老孙', '福生仓', '推理', '福生仓与公董局', '暂不找人', '自然收束'],
    target_scene: 'end_conspiracy',
  },
  end_conspiracy_detail: {
    title: '雨夜灯火（隐藏）',
    keywords: ['先问几个问题', '委托我接了', '圣约翰大学', '问舍监', '门房', '论文草稿', '去下一个地方', '巡捕房', '卷宗', '王巡官', '薛华立路', '周围观察', '跟踪', '沈玉兰', '203', '搜查', '地图', '光华小学', '陈老师', '苏晚亭关系', '异常', '办公室', '信', '吴校长', '恐吓信', '合影', '日记', '合到一起', '推理陈明远之死', '当铺', '翡翠镯', '周怀安', '继续拿出', '黑衣男人', '老孙', '支援', '福生仓', '便衣', '潜入', '教具箱', '暗门', '暗室', '救人', '带她离开', '医院', '分开保护', '医生', '陆念薇', '自然收束'],
    target_scene: 'end_conspiracy_detail',
  },
  end_zhou_chen_letter: {
    title: '吾爱晚亭（周怀安双信）',
    keywords: ['先问几个问题', '委托我接了', '圣约翰大学', '问舍监', '门房', '论文草稿', '去下一个地方', '巡捕房', '卷宗', '王巡官', '薛华立路', '周围观察', '跟踪', '沈玉兰', '203', '搜查', '光华小学', '陈老师', '苏晚亭关系', '异常', '办公室', '信', '吴校长', '恐吓信', '合影', '日记', '合到一起', '推理陈明远之死', '当铺', '翡翠镯', '周怀安', '陈明远的信', '遗书', '苏晚亭的遗书', '未寄出的信'],
    target_scene: 'end_zhou_chen_letter',
  },
  end_true_hidden: {
    title: '破晓之前（真隐藏）',
    keywords: ['先问几个问题', '委托我接了', '苏家', '看她母亲', '圣约翰大学', '问舍监', '门房', '论文草稿', '去下一个地方', '巡捕房', '卷宗', '王巡官', '薛华立路', '周围观察', '跟踪', '沈玉兰', '203', '搜查', '地图', '光华小学', '陈老师', '苏晚亭关系', '异常', '办公室', '信', '吴校长', '恐吓信', '合影', '日记', '合到一起', '推理陈明远之死', '当铺', '翡翠镯', '周怀安', '继续拿出', '黑衣男人', '老孙', '支援', '福生仓', '便衣', '教具箱', '暗门', '救人', '带她离开', '医院', '分开保护', '医生', '陆念薇', '傅启元', '福生仓与公董局', '自然收束'],
    target_scene: 'end_true_hidden',
  },
  end_dock_silenced: {
    title: '雾中枪声（码头坏结局）',
    keywords: ['先问几个问题', '委托我接了', '圣约翰大学', '问舍监', '门房', '论文草稿', '去下一个地方', '巡捕房', '卷宗', '王巡官', '薛华立路', '周围观察', '跟踪', '沈玉兰', '203', '搜查', '地图', '光华小学', '陈老师', '苏晚亭关系', '异常', '办公室', '信', '吴校长', '恐吓信', '合影', '日记', '合到一起', '推理陈明远之死', '当铺', '翡翠镯', '周怀安', '继续拿出', '黑衣男人', '不找支援', '独自', '福生仓', '后门观察', '硬对峙', '站到车灯前'],
    target_scene: 'end_dock_silenced',
  },
};

function patchRunner(route) {
  const runnerCode = fs.readFileSync(RUNNER, 'utf8');
  // Replace GOLDEN_KEYWORDS with route-specific keywords
  const kwJson = JSON.stringify(route.keywords);
  const patched = runnerCode.replace(
    /const GOLDEN_KEYWORDS = \[[^\]]+\];/,
    `const GOLDEN_KEYWORDS = ${kwJson};`
  );
  const tmpRunner = path.join(ROOT, 'tmp/_ending_runner.mjs');
  fs.writeFileSync(tmpRunner, patched);
  return tmpRunner;
}

function runForEnding(endingId) {
  const route = ENDING_ROUTES[endingId];
  if (!route) return { endingId, ok: false, error: '未知结局' };

  process.stdout.write(`  ${endingId} (${route.title})... `);

  try {
    const tmpRunner = patchRunner(route);
    const result = execSync(`node "${tmpRunner}" --strategy=golden --max-depth=300 2>&1`, {
      cwd: ROOT,
      timeout: 60000,
      encoding: 'utf8',
    });

    // Parse JSON result
    const jsonMatch = result.match(/\{[\s\S]*\n\}/);
    let report;
    try {
      report = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      report = null;
    }

    if (!report) {
      console.log(`❌ 无法解析报告`);
      return { endingId, ok: false, error: '解析失败' };
    }

    const reachedScene = report.finalScene;
    const reachedEndings = report.reachedEndingCount || 0;
    const targetScene = route.target_scene;
    const reached = reachedScene === targetScene || report.transitions?.some(t => t.ending === targetScene);

    if (reached) {
      console.log(`✅ ${report.transitions?.length || '?'}步到达 ${targetScene}`);
    } else {
      const lastScene = reachedScene || report.transitions?.[report.transitions.length-1]?.from || '?';
      console.log(`❌ 停于 ${lastScene}`);
    }

    // Check target flags
    const flags = report.finalFlags || report.flags || {};
    return {
      endingId,
      title: route.title,
      ok: reached,
      steps: report.transitions?.length || 0,
      finalScene: reachedScene,
      flags: Object.keys(flags).filter(k => flags[k]).slice(0, 15),
    };
  } catch (err) {
    console.log(`❌ 报错: ${err.message?.split('\n')[0] || err}`);
    return { endingId, ok: false, error: err.message };
  }
}

// ==== 主程序 ====
const target = process.argv.find(a => a.startsWith('--ending='))?.split('=')[1];

console.log('🎯 雾锁迷踪 · 结局猎手 v2\n');

const targets = target ? [target] : Object.keys(ENDING_ROUTES);
const results = [];

for (const id of targets) {
  results.push(runForEnding(id));
}

console.log('\n📊 汇总:');
let passed = 0;
for (const r of results) {
  const mark = r.ok ? '✅' : '❌';
  if (r.ok) passed++;
  console.log(`  ${mark} ${r.endingId} — ${r.steps}步${r.ok ? '' : ' ❌'}`);
}
console.log(`\n${passed}/${results.length}`);
console.log(`\n详细报告: tmpp/_ending_*.json`);

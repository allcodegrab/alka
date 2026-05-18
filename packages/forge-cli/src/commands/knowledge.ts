import { Command } from 'commander';
import { resolve } from 'node:path';
import { ensureIndex, query, clearCache } from '@forge/knowledge';

function getProjectRoot(): string {
  return resolve(process.cwd());
}

export function knowledgeCommand(): Command {
  const cmd = new Command('knowledge').description('Manage the project knowledge graph');

  cmd
    .command('build')
    .description('Build the knowledge graph and search index')
    .action(async () => {
      const root = getProjectRoot();
      console.log('Building knowledge graph...');

      const start = Date.now();
      const { graph, bm25, tfidf } = await ensureIndex(root);
      const elapsed = Date.now() - start;

      console.log(`Done in ${elapsed}ms.`);
      console.log(`  Graph: ${graph.nodeCount} nodes, ${graph.edgeCount} edges`);
      console.log(`  BM25:  ${bm25.documentCount} documents indexed`);
      console.log(`  TF-IDF: ${tfidf.documentCount} documents, ${tfidf.vocabularySize} terms`);
    });

  cmd
    .command('stats')
    .description('Show knowledge graph statistics')
    .action(async () => {
      const root = getProjectRoot();
      const { graph, bm25, tfidf } = await ensureIndex(root);

      console.log('Knowledge Graph Stats:');
      console.log(`  Nodes: ${graph.nodeCount}`);
      console.log(`  Edges: ${graph.edgeCount}`);
      console.log(`  BM25 documents: ${bm25.documentCount}`);
      console.log(`  TF-IDF vocabulary: ${tfidf.vocabularySize} terms`);

      // Count by type
      const types = new Map<string, number>();
      for (const node of graph.getAllNodes()) {
        types.set(node.type, (types.get(node.type) ?? 0) + 1);
      }
      console.log('\n  By type:');
      for (const [type, count] of [...types.entries()].sort()) {
        console.log(`    ${type}: ${count}`);
      }
    });

  cmd
    .command('query <intent>')
    .description('Query the knowledge graph')
    .option('-k <count>', 'Number of results', '12')
    .option('--no-graph', 'Skip graph expansion')
    .action(async (intent: string, opts: { k: string; graph: boolean }) => {
      const root = getProjectRoot();
      const result = await query({
        projectRoot: root,
        intent,
        k: parseInt(opts.k, 10),
        includeGraph: opts.graph,
      });

      console.log(
        `Results for: "${intent}" (${result.chunks.length} chunks, ~${result.totalTokens} tokens)\n`,
      );

      for (const chunk of result.chunks) {
        const score = chunk.score.toFixed(3);
        console.log(`  [${score}] ${chunk.source}`);
        // Show first 100 chars of content
        const preview = chunk.content.slice(0, 100).replace(/\n/g, ' ');
        console.log(`    ${preview}${chunk.content.length > 100 ? '...' : ''}`);
        console.log('');
      }

      if (result.graphNodes.length > 0) {
        console.log(`  Graph context: ${result.graphNodes.length} related nodes`);
      }
    });

  cmd
    .command('clear')
    .description('Clear the cached knowledge index')
    .action(() => {
      clearCache();
      console.log('Knowledge cache cleared.');
    });

  return cmd;
}

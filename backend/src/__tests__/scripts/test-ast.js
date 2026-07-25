const Parser = require('tree-sitter');
const ts = require('tree-sitter-typescript').tsx;

const parser = new Parser();
parser.setLanguage(ts);

const tree = parser.parse(`
import React from 'react';
const experiencesData = [
  { role: "Contributor" }
];
export default function ExperienceSection() {
  return <div></div>;
}
`);

function walk(node, depth=0) {
  console.log("  ".repeat(depth) + node.type + (node.isNamed ? " (named)" : ""));
  for(let i = 0; i < node.childCount; i++) {
    walk(node.child(i), depth + 1);
  }
}
walk(tree.rootNode);

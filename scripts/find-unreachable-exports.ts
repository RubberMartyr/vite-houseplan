#!/usr/bin/env tsx

import path from "node:path";
import { Project, SourceFile, Node, ExportedDeclarations } from "ts-morph";

const project = new Project({
  tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
  skipAddingFilesFromTsConfig: false,
});

const sourceFiles = project
  .getSourceFiles("src/**/*.{ts,tsx}")
  .filter((file) => !file.isDeclarationFile());

type ExportRecord = {
  sourceFile: SourceFile;
  exportName: string;
  declaration: Node;
};

function collectExports(sourceFile: SourceFile): ExportRecord[] {
  const records: ExportRecord[] = [];
  const exportedDeclarations = sourceFile.getExportedDeclarations();

  for (const [exportName, declarations] of exportedDeclarations) {
    for (const declaration of declarations) {
      if (Node.isExportSpecifier(declaration)) {
        continue;
      }

      if (
        Node.isImportSpecifier(declaration) ||
        Node.isImportClause(declaration) ||
        Node.isNamespaceImport(declaration)
      ) {
        continue;
      }

      records.push({ sourceFile, exportName, declaration });
    }
  }

  return records;
}

function hasExternalReference(declaration: Node): boolean {
  const refs = declaration.findReferencesAsNodes();

  for (const refNode of refs) {
    if (refNode === declaration) {
      continue;
    }

    const refSource = refNode.getSourceFile();
    const declSource = declaration.getSourceFile();

    if (refSource.getFilePath() !== declSource.getFilePath()) {
      return true;
    }

    const parent = refNode.getParent();
    if (parent && Node.isExportSpecifier(parent)) {
      continue;
    }

    if (Node.isExportSpecifier(refNode)) {
      continue;
    }

    if (parent && Node.isExportAssignment(parent)) {
      continue;
    }

    return true;
  }

  return false;
}

const unreachable: ExportRecord[] = [];

for (const sourceFile of sourceFiles) {
  const exportsInFile = collectExports(sourceFile);
  for (const record of exportsInFile) {
    if (!hasExternalReference(record.declaration)) {
      unreachable.push(record);
    }
  }
}

if (unreachable.length === 0) {
  console.log("No unreachable exports found.");
  process.exit(0);
}

console.log("Unreachable exports:");
for (const item of unreachable.sort((a, b) => {
  const byFile = a.sourceFile.getFilePath().localeCompare(b.sourceFile.getFilePath());
  if (byFile !== 0) {
    return byFile;
  }
  return a.exportName.localeCompare(b.exportName);
})) {
  const relativePath = path.relative(process.cwd(), item.sourceFile.getFilePath());
  const line = item.declaration.getStartLineNumber();
  console.log(`- ${relativePath}:${line} -> ${item.exportName}`);
}

process.exit(1);

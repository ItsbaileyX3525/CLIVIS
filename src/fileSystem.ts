export type NodeType = 'dir' | 'file' | 'image' | 'game';

export interface FileNode {
  name: string;
  type: NodeType;
  children?: FileNode[];
  content?: string;
}

export const fileSystem: FileNode = {
  name: '/',
  type: 'dir',
  children: [
    { name: 'home', type: 'dir', children: [
      { name: 'baile', type: 'dir', children: [
        { name: 'Downloads', type: 'dir', children: [
          { name: 'readme.md', type: 'file', content: "Hello, if you can read this then awesome!"},
          { name: 'elot.png', type: 'image', content: "/images/Elot.png"},
          { name: 'fun.py', type: 'file', content: `
output = ""
for e in range(10):
    output += str(e) + "\\n"
output`},
        ] },
        { name: 'Pictures', type: 'dir', children: [] },
        { name: 'Documents', type: 'dir', children: [] },
      ]}
    ] },
    { name: 'etc', type: 'dir', children: [] },
    { name: 'games', type: 'dir', children: [
      { name: 'susClicker.AppImage', type: 'game', content: 'susclicker'},
      { name: 'platformer.AppImage', type: 'game', content: "platformer" },
      { name: 'solarSandbox.AppImage', type: 'game', content: 'solar' }
    ] },
  ]
};

export function findDir(path: string, fs: FileNode = fileSystem): FileNode | null {
  const parts = path.split('/').filter(Boolean);
  let current: FileNode = fs;

  for (const part of parts) {
    if (!current.children) return null;
    const next = current.children.find(node => node.name === part && node.type === 'dir');
    if (!next) return null;
    current = next;
  }

  return current;
}

export function addDir(path: string, dirName: string): boolean {
  const parent = findDir(path);
  if (!parent || !parent.children) return false;

  if (parent.children.some(node => node.name === dirName)) return false;

  parent.children.push({ name: dirName, type: 'dir', children: [] });
  return true;
}

export function deleteDir(path: string): boolean {
  const parts = path.split('/').filter(Boolean);
  const dirName = parts.pop();
  if (!dirName) return false;

  const parent = findDir('/' + parts.join('/'));
  if (!parent || !parent.children) return false;

  parent.children = parent.children.filter(node => node.name !== dirName);
  return true;  
}

export function addFile(path: string, fileName: string): boolean {
  const parent = findDir(path);
  if (!parent || !parent.children) return false;

  if (parent.children.some(node => node.name === fileName)) return false;

  parent.children.push({ name: fileName, type: 'file', content: "" });
  return true;
}

export function findNode(path: string, fs: FileNode = fileSystem): FileNode | null {
  const parts = path.split('/').filter(Boolean);
  let current: FileNode = fs;

  for (const part of parts) {
    if (!current.children) return null;
    const next = current.children.find(node => node.name === part);
    if (!next) return null;
    current = next;
  }

  return current;
}

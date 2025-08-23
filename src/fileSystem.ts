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
          { name: 'pythonScripts', type: 'dir', children: [
            { name: 'loop.py', type: 'file', content: `
output = ""
for e in range(10):
    output += str(e) + "\\n"
output`     },
            { name: 'fibonacci.py', type: 'file', content: `
# Fibonacci sequence generator
def fibonacci(n):
    sequence = []
    a, b = 0, 1
    for i in range(n):
        sequence.append(a)
        a, b = b, a + b
    return sequence

# Generate first 15 fibonacci numbers
fib_nums = fibonacci(15)
result = "First 15 Fibonacci numbers:\\n"
result += ", ".join(map(str, fib_nums))
result += f"\\n\\nFun fact: The 15th Fibonacci number is {fib_nums[-1]}"
result`     },
            { name: 'prime_checker.py', type: 'file', content: `
# Prime number checker and generator
def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True

def find_primes(limit):
    return [n for n in range(2, limit + 1) if is_prime(n)]

# Find all prime numbers up to 50
primes = find_primes(50)
result = f"Prime numbers up to 50:\\n{primes}\\n\\n"

# Check some specific numbers
test_numbers = [17, 25, 29, 100, 97]
result += "Prime checker results:\\n"
for num in test_numbers:
    result += f"{num} is {'prime' if is_prime(num) else 'not prime'}\\n"

result`     },
            { name: 'ascii_art.py', type: 'file', content: `
# ASCII art generator
def create_diamond(size):
    diamond = ""
    # Upper half
    for i in range(size):
        spaces = " " * (size - i - 1)
        stars = "*" * (2 * i + 1)
        diamond += spaces + stars + "\\n"
    
    # Lower half
    for i in range(size - 2, -1, -1):
        spaces = " " * (size - i - 1)
        stars = "*" * (2 * i + 1)
        diamond += spaces + stars + "\\n"
    
    return diamond

def create_triangle(height):
    triangle = ""
    for i in range(height):
        spaces = " " * (height - i - 1)
        stars = "*" * (2 * i + 1)
        triangle += spaces + stars + "\\n"
    return triangle

def create_rectangle(width, height):
    rectangle = ""
    for i in range(height):
        if i == 0 or i == height - 1:
            rectangle += "*" * width + "\\n"
        else:
            rectangle += "*" + " " * (width - 2) + "*\\n"
    return rectangle

result = "ASCII Art Gallery\\n\\n"
result += "Diamond (size 5):\\n"
result += create_diamond(5)
result += "\\nTriangle (height 6):\\n"
result += create_triangle(6)
result += "\\nRectangle (8x5):\\n"
result += create_rectangle(8, 5)

result`     },
          ] },
          { name: 'readme.md', type: 'file', content: "Hahaha, there actually isn't much to read here."},
          { name: 'elot.png', type: 'image', content: "/images/Elot.png"},
          { name: 'fun.py', type: 'file', content: `
output = ""
for e in range(10):
    output += str(e) + "\\n"
output`},
        ] },
        { name: 'Pictures', type: 'dir', children: [
          { name: 'maxwell.png', type: 'image', content: "/images/MaxwellHasBreachedContainment.png" },
          { name: 'lavaChicken.png', type: 'image', content: '/images/lavaChicken.png' },
          { name: 'scaredHeidi.png', type: 'image', content: '/images/scared_heidi.png' },
          { name: 'myKitten.png', type: 'image', content: '/images/DanielJamesOrmandy.png' },
          { name: 'tbbt.png', type: 'image', content: '/images/tbbt.png' },
        ] },
        { name: 'Documents', type: 'dir', children: [
          { name: 'doggurments.txt', type: 'file', content: 'DoggurCoin is good!' },
          { name: 'nuclearLaunchCodes.txt', type: 'file', content: '79284773894342' },
          { name: 'CV.pdf', type: 'file', content: 'Props for trying to cat a pdf' }
        ] },
      ]}
    ] },
    { name: 'etc', type: 'dir', children: [
      { name: 'catMe.txt', type: 'file', content: 'I don\'t know what actually goes in the /etc dir, suppose I can always check my own distro\s /etc but nahhhh' }
    ] },
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

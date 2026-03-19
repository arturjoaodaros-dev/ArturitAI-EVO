/* ═══════════════════════════════════════════════════════════════════════════
   js/knowledge.js  —  ArturitAI Language Knowledge Base
   15-language command stubs: Python, JS, TS, Java, C++, Rust, Go, Ruby,
   PHP, Swift, Kotlin, Scala, R, C#, Luau
   ═══════════════════════════════════════════════════════════════════════════ */
   §4 — EXPANDED LANGUAGE KNOWLEDGE BASE (KB_LANG)
   Provides command stubs for all 15 supported languages.
   Used by ScriptMaker to select commands during code construction.
   Structure: { [language]: { [commandKey]: { syntax, desc, examples, edge } } }
   ═══════════════════════════════════════════════════════════════════════════ */
var KB_LANG = (function() {

  /* ── Compact representation helpers ── */
  function cmd(syntax, desc, examples, edge, related) {
    return { syntax: syntax, desc: desc, examples: examples || [], edge: edge || [], related: related || [] };
  }

  return {

    /* ───────────────────────── PYTHON ───────────────────────────── */
    python: {
      'import':     cmd('import {{mod}} [as {{alias}}]', 'Import a module', ['import os','import numpy as np'], ['ModuleNotFoundError','circular imports']),
      'from_import':cmd('from {{mod}} import {{name}}', 'Partial import', ['from pathlib import Path'], ['name conflicts']),
      'def':        cmd('def {{name}}({{params}}) -> {{ret}}:\n    {{body}}', 'Define a function', ['def add(a,b): return a+b'], ['missing return','type mismatch']),
      'class':      cmd('class {{Name}}({{Base}}):\n    def __init__(self,{{p}}):\n        {{body}}', 'Define a class', ['class Dog(Animal): pass'], ['MRO issues','super() call order']),
      'for':        cmd('for {{x}} in {{iterable}}:\n    {{body}}', 'For loop', ['for i in range(10): print(i)'], ['StopIteration','off-by-one']),
      'while':      cmd('while {{cond}}:\n    {{body}}', 'While loop', ['while x > 0: x -= 1'], ['infinite loop','missing update']),
      'list_comp':  cmd('[{{expr}} for {{x}} in {{iter}} if {{cond}}]', 'List comprehension', ['[x**2 for x in range(10) if x%2==0]'], ['memory for large iterables']),
      'dict_comp':  cmd('{{{k}}:{{v}} for {{x}} in {{iter}}}', 'Dict comprehension', ['{k:len(k) for k in words}'], []),
      'lambda':     cmd('lambda {{p}}: {{expr}}', 'Anonymous function', ['square = lambda x: x**2'], ['no statements inside']),
      'try_except': cmd('try:\n    {{body}}\nexcept {{Err}} as e:\n    {{handler}}\nfinally:\n    {{cleanup}}', 'Error handling', ['try: f=open("x") except FileNotFoundError: pass'], ['bare except','swallowing errors']),
      'with':       cmd('with {{ctx}} as {{var}}:\n    {{body}}', 'Context manager', ['with open("f") as f: data=f.read()'], ['AttributeError if no __exit__']),
      'dataclass':  cmd('@dataclass\nclass {{Name}}:\n    {{field}}: {{type}}', 'Data class', ['@dataclass\nclass Point:\n    x:float\n    y:float'], ['mutable defaults']),
      'generator':  cmd('def {{name}}({{p}}):\n    yield {{value}}', 'Generator function', ['def counter(n):\n    for i in range(n): yield i'], ['StopIteration','send()']),
      'decorator':  cmd('@{{decorator}}\ndef {{name}}({{p}}):\n    {{body}}', 'Apply a decorator', ['@property\n@staticmethod\n@classmethod'], ['order of multiple decorators']),
      'f_string':   cmd('f"{{text}} {{{expr}}}"', 'Formatted string literal', ['f"Hello {name}!"'], ['nested quotes','= specifier']),
      'print':      cmd('print({{val}}, end={{end}}, sep={{sep}})', 'Print to stdout', ['print("hello","world",sep="-")'], ['UnicodeEncodeError','buffered output']),
      'input_fn':   cmd('{{var}} = input({{prompt}})', 'Read from stdin', ['name = input("Name: ")'], ['returns str — cast as needed']),
      'open_file':  cmd('with open({{path}}, {{mode}}) as f:\n    {{body}}', 'File I/O', ["with open('data.txt','r') as f: lines=f.readlines()"], ['encoding param','FileNotFoundError']),
      'random':     cmd('import random\nrandom.{{method}}()', 'Randomness', ['random.randint(1,6)','random.choice(items)','random.shuffle(lst)'], ['seed for reproducibility']),
      'math':       cmd('import math\nmath.{{func}}({{args}})', 'Math operations', ['math.sqrt(16)','math.pi','math.floor(3.9)'], ['precision floats']),
      'enumerate':  cmd('for {{i}}, {{v}} in enumerate({{lst}}, {{start}}):', 'Enumerated loop', ['for i, val in enumerate(items, 1): print(i, val)'], []),
      'zip':        cmd('for {{a}},{{b}} in zip({{l1}},{{l2}}):', 'Parallel iteration', ['for x,y in zip(xs,ys): print(x+y)'], ['shortest stops']),
      'sorted_fn':  cmd('sorted({{iterable}}, key={{fn}}, reverse={{bool}})', 'Sort (returns new)', ['sorted(words, key=len)'], ['stable sort']),
      'map_filter': cmd('list(map({{fn}}, {{iter}}))\nlist(filter({{fn}}, {{iter}}))', 'Functional transforms', ['list(map(str.upper, words))'], ['map returns iterator in Python 3']),
      'argparse':   cmd('import argparse\nparser = argparse.ArgumentParser()\nparser.add_argument("--{{flag}}")\nargs = parser.parse_args()', 'CLI argument parsing', [], ['sys.argv directly for simple scripts']),
      'threading':  cmd('import threading\nt = threading.Thread(target={{fn}}, args={{args}})\nt.start()\nt.join()', 'Threading', [], ['GIL limits CPU-bound parallelism']),
      'asyncio':    cmd('import asyncio\nasync def {{name}}():\n    await {{expr}}\nasyncio.run({{name}}())', 'Async/await', ['async def fetch(): await asyncio.sleep(1)'], ['cannot mix sync blocking calls']),
    },

    /* ─────────────────────── JAVASCRIPT ─────────────────────────── */
    javascript: {
      'const_let':   cmd('const {{name}} = {{val}};\nlet {{name}} = {{val}};', 'Variable declaration', ['const PI = 3.14;','let count = 0;'], ['const ≠ immutable object','TDZ']),
      'arrow_fn':    cmd('const {{name}} = ({{p}}) => {{expr}};', 'Arrow function', ['const square = x => x*x;'], ['no own this','no arguments object']),
      'function':    cmd('function {{name}}({{p}}) {\n  {{body}}\n  return {{val}};\n}', 'Named function', ['function add(a,b){return a+b;}'], ['hoisting']),
      'class':       cmd('class {{Name}} extends {{Base}} {\n  constructor({{p}}) { super(); }\n  {{method}}() {}\n}', 'ES6 Class', ['class Dog extends Animal { bark(){} }'], ['prototype chain']),
      'promise':     cmd('new Promise((resolve,reject)=>{\n  {{body}}\n}).then({{onFulf}}).catch({{onErr}})', 'Promise chain', ['fetch(url).then(r=>r.json()).catch(console.error)'], ['unhandled rejection']),
      'async_await': cmd('async function {{name}}() {\n  const {{r}} = await {{expr}};\n}', 'Async/await', ['async function load(){const d=await fetch(url); return d.json();}'], ['must await to get resolved value']),
      'fetch':       cmd("fetch('{{url}}', { method:'{{M}}', headers:{}, body:JSON.stringify({{data}}) })\n  .then(r=>r.json())", 'HTTP request', ["fetch('/api/data').then(r=>r.json()).then(console.log)"], ['CORS','network errors']),
      'map_arr':     cmd('{{arr}}.map({{fn}})', 'Transform array', ['nums.map(x=>x*2)'], ['returns new array']),
      'filter_arr':  cmd('{{arr}}.filter({{pred}})', 'Filter array', ['words.filter(w=>w.length>3)'], ['returns new array']),
      'reduce_arr':  cmd('{{arr}}.reduce(({{acc}},{{cur}})=>{{expr}}, {{init}})', 'Reduce array', ['nums.reduce((s,x)=>s+x,0)'], ['initial value matters']),
      'spread':      cmd('[...{{arr1}}, ...{{arr2}}]', 'Spread / merge', ['const merged = [...a,...b];'], ['shallow copy only']),
      'destructure': cmd('const {{{a}},{{b}}} = {{obj}};\nconst [{{x}},{{y}}] = {{arr}};', 'Destructuring', ['const {name,age}=person;'], ['undefined if key absent']),
      'template_lit':cmd('`{{text}} ${{{expr}}}`', 'Template literal', ['`Hello ${name}!`'], ['expression context']),
      'dom_query':   cmd('document.querySelector(\'{{sel}}\');\ndocument.querySelectorAll(\'{{sel}}\');', 'DOM selection', ["document.querySelector('#btn')"], ['null if not found']),
      'event_listen':cmd("{{el}}.addEventListener('{{event}}', ({{e}}) => {\n  {{body}}\n});", 'Event handler', ["btn.addEventListener('click', e=>console.log(e))"], ['removeEventListener needs same ref']),
      'set_interval': cmd('const id = setInterval({{fn}}, {{ms}});\nclearInterval(id);', 'Repeat execution', ['const t=setInterval(()=>tick(),100);'], ['drift over time']),
      'canvas':      cmd('const c = document.createElement(\'canvas\');\nconst ctx = c.getContext(\'2d\');', 'Canvas setup', ['ctx.fillRect(0,0,w,h)','ctx.arc(x,y,r,0,Math.PI*2)'], ['coordinate system top-left']),
      'local_storage':cmd("localStorage.setItem('{{key}}',JSON.stringify({{val}}));\nJSON.parse(localStorage.getItem('{{key}}'))", 'Local storage', [], ['5 MB limit','strings only']),
      'json':        cmd('JSON.stringify({{obj}});\nJSON.parse({{str}});', 'JSON serialization', ['JSON.stringify({a:1},{},2)'], ['circular ref throws','undefined removed']),
      'error_handling':cmd('try {\n  {{body}}\n} catch(e) {\n  console.error(e);\n} finally {\n  {{cleanup}}\n}', 'Error handling', [], ['catch all errors — discriminate by e.constructor']),
      'module':      cmd("import { {{name}} } from '{{mod}}';\nexport const {{name}} = {{val}};", 'ES Modules', ["import { useState } from 'react';"], ['top-level only','live bindings']),
    },

    /* ─────────────────────── TYPESCRIPT ─────────────────────────── */
    typescript: {
      'interface':   cmd('interface {{Name}} {\n  {{prop}}: {{type}};\n}', 'Interface', ['interface User { id:number; name:string; }'], ['structural typing']),
      'type_alias':  cmd('type {{Name}} = {{type}};', 'Type alias', ['type ID = string | number;'], ['cannot be extended (use interface)']),
      'generic':     cmd('function {{name}}<T>({{p}}: T): T {\n  return {{p}};\n}', 'Generic function', ['function id<T>(x:T):T{return x;}'], ['type inference','constraints']),
      'enum':        cmd('enum {{Name}} { {{A}}, {{B}} }', 'Enum', ['enum Dir { Up, Down, Left, Right }'], ['reverse mapping for numeric enums']),
      'optional':    cmd('{{prop}}?: {{type}}', 'Optional property', ['name?: string'], ['nullish coalescing ??']),
      'readonly':    cmd('readonly {{prop}}: {{type}}', 'Read-only property', ['readonly id: number'], ['shallow readonly']),
      'utility_types':cmd('Partial<{{T}}>\nRequired<{{T}}>\nPick<{{T}},{{K}}>\nOmit<{{T}},{{K}}>', 'Utility types', ['type Opt = Partial<User>'], []),
    },

    /* ──────────────────────── LUAU ──────────────────────────────── */
    luau: {
      'local_var':   cmd('local {{name}} = {{value}}', 'Local variable', ['local x = 10'], ['global vs local scope']),
      'function':    cmd('local function {{name}}({{params}})\n    {{body}}\n    return {{val}}\nend', 'Function definition', ['local function greet(name) return "Hi "..name end'], []),
      'for_range':   cmd('for {{i}} = {{start}}, {{stop}}, {{step}} do\n    {{body}}\nend', 'Numeric for', ['for i=1,10 do print(i) end'], ['step defaults to 1']),
      'for_in':      cmd('for {{k}}, {{v}} in pairs({{table}}) do\n    {{body}}\nend', 'Generic for (table)', ['for k,v in pairs(t) do print(k,v) end'], ['ipairs for arrays']),
      'while':       cmd('while {{cond}} do\n    {{body}}\nend', 'While loop', ['while x > 0 do x = x-1 end'], ['repeat...until available']),
      'if_then':     cmd('if {{cond}} then\n    {{body}}\nelseif {{c2}} then\n    {{b2}}\nelse\n    {{el}}\nend', 'Conditional', ['if score >= 90 then grade="A" end'], []),
      'table':       cmd('local {{name}} = { {{key}} = {{val}} }', 'Table (object/array)', ['local pos = {x=0,y=0}'], ['1-indexed arrays']),
      'string_ops':  cmd('string.format("{{fmt}}", {{args}})\nstring.len({{s}})\nstring.sub({{s}},{{i}},{{j}})', 'String operations', ['string.format("Score: %d", score)'], []),
      'coroutine':   cmd('local co = coroutine.create(function()\n    {{body}}\nend)\ncoroutine.resume(co)', 'Coroutine', [], ['cooperative multitasking']),
      'roblox':      cmd('game:GetService("{{Svc}}")', 'Roblox service', ['game:GetService("Players")','game:GetService("RunService")'], ['must be server/client context aware']),
    },

    /* ────────────────────────── JAVA ────────────────────────────── */
    java: {
      'class':       cmd('public class {{Name}} {\n    {{fields}}\n    public {{Name}}({{p}}) { {{body}} }\n    public {{ret}} {{method}}({{p}}) { {{body}} }\n}', 'Class definition', [], ['extends','implements','access modifiers']),
      'main':        cmd('public static void main(String[] args) {\n    {{body}}\n}', 'Entry point', [], ['String[] args']),
      'interface':   cmd('public interface {{Name}} {\n    {{ret}} {{method}}({{p}});\n}', 'Interface', [], ['default methods (Java 8+)']),
      'generics':    cmd('public <T> {{ret}} {{name}}(T {{p}}) {\n    {{body}}\n}', 'Generic method', [], ['type erasure','wildcards <?>']),
      'stream':      cmd('{{collection}}.stream()\n    .filter({{pred}})\n    .map({{fn}})\n    .collect(Collectors.toList())', 'Stream API', [], ['lazy evaluation']),
      'optional_j':  cmd('Optional<{{T}}> opt = Optional.of({{val}});\nopt.orElse({{default}});', 'Optional', [], ['NPE avoidance']),
      'try_catch_j': cmd('try {\n    {{body}}\n} catch ({{Exception}} e) {\n    {{handler}}\n} finally {\n    {{cleanup}}\n}', 'Exception handling', [], ['checked vs unchecked exceptions']),
      'lambda_j':    cmd('({{p}}) -> {{expr}}', 'Lambda (Java 8+)', ['list.forEach(x -> System.out.println(x))'], ['functional interfaces only']),
      'arraylist':   cmd('List<{{T}}> list = new ArrayList<>();\nlist.add({{val}});\nlist.get({{i}});', 'ArrayList', [], ['autoboxing','index bounds']),
      'hashmap_j':   cmd('Map<{{K}},{{V}}> map = new HashMap<>();\nmap.put({{k}},{{v}});\nmap.get({{k}});', 'HashMap', [], ['null keys allowed','not thread-safe']),
    },

    /* ──────────────────────── C++ ───────────────────────────────── */
    cpp: {
      'include':     cmd('#include <{{header}}>', 'Include header', ['#include <iostream>','#include <vector>','#include <memory>'], ['order matters for some compilers']),
      'namespace':   cmd('using namespace {{ns}};\nnamespace {{name}} { {{body}} }', 'Namespace', ['using namespace std;'], ['avoid using namespace std in headers']),
      'class_cpp':   cmd('class {{Name}} : public {{Base}} {\npublic:\n    {{Name}}({{p}});\nprivate:\n    {{fields}};\n};', 'Class', [], ['Rule of Five','virtual destructor']),
      'template':    cmd('template<typename T>\nT {{name}}(T {{a}}, T {{b}}) { {{body}} }', 'Template', ['template<typename T> T max(T a,T b){return a>b?a:b;}'], ['instantiation bloat','specialization']),
      'smart_ptr':   cmd('std::unique_ptr<{{T}}> p = std::make_unique<{{T}}>({{args}});\nstd::shared_ptr<{{T}}> sp = std::make_shared<{{T}}>({{args}});', 'Smart pointers', [], ['cyclic refs with shared_ptr']),
      'vector_cpp':  cmd('std::vector<{{T}}> v;\nv.push_back({{val}});\nv.emplace_back({{args}});', 'std::vector', [], ['iterator invalidation on push_back']),
      'lambda_cpp':  cmd('[{{capture}}]({{p}}) { {{body}} }', 'Lambda', ['[&](int x){ return x*2; }'], ['capture by value vs reference']),
      'range_for':   cmd('for (const auto& {{x}} : {{container}}) {\n    {{body}}\n}', 'Range-for loop', ['for(const auto& e : v) cout<<e;'], ['must be iterable']),
      'optional_cpp':cmd('std::optional<{{T}}> opt = {{val}};\nif (opt) { auto v = *opt; }', 'std::optional (C++17)', [], ['std::nullopt for empty']),
      'struct_bind': cmd('auto [{{a}},{{b}}] = {{expr}};', 'Structured bindings (C++17)', ['auto [k,v] = *map.begin();'], []),
    },

    /* ────────────────────────── RUST ────────────────────────────── */
    rust: {
      'fn':          cmd('fn {{name}}({{p}}: {{T}}) -> {{R}} {\n    {{body}}\n}', 'Function', ['fn add(a:i32,b:i32)->i32{a+b}'], ['ownership transfer','borrow rules']),
      'struct_r':    cmd('struct {{Name}} {\n    {{field}}: {{T}},\n}', 'Struct', ['struct Point{x:f64,y:f64}'], ['derive macros']),
      'impl':        cmd('impl {{Name}} {\n    pub fn {{method}}(&self) -> {{R}} {\n        {{body}}\n    }\n}', 'Implementation block', [], ['&self vs &mut self vs self']),
      'enum_r':      cmd('enum {{Name}} {\n    {{A}},\n    {{B}}({{T}}),\n}', 'Enum with data', ['enum Shape{Circle(f64),Rect(f64,f64)}'], ['exhaustive match required']),
      'match':       cmd('match {{val}} {\n    {{pattern}} => {{expr}},\n    _ => {{default}},\n}', 'Pattern match', ['match x { 0=>println!("zero"), _=>() }'], ['must be exhaustive']),
      'option_r':    cmd('Option<{{T}}>\nif let Some({{v}}) = {{opt}} { {{body}} }', 'Option type', ['if let Some(x)=find(){println!("{x}")}'], ['unwrap() panics on None']),
      'result_r':    cmd('Result<{{T}},{{E}}>\nmatch {{expr}} { Ok({{v}})=>{{a}}, Err({{e}})=>{{b}} }', 'Result type', ['fn div(a:f64,b:f64)->Result<f64,String>{}'], ['? operator for propagation']),
      'vec_r':       cmd('let mut v: Vec<{{T}}> = Vec::new();\nv.push({{val}});', 'Vec', ['let mut v:Vec<i32>=vec![1,2,3];'], ['borrow checker with mutable access']),
      'iter_r':      cmd('{{v}}.iter().map(|{{x}}| {{expr}}).filter(|{{x}}| {{pred}}).collect::<Vec<_>>()', 'Iterator chain', ['v.iter().map(|x|x*2).collect::<Vec<_>>()'], ['collect needs type annotation']),
      'trait':       cmd('trait {{Name}} {\n    fn {{method}}(&self) -> {{R}};\n}\nimpl {{Name}} for {{Type}} {\n    fn {{method}}(&self) -> {{R}} { {{body}} }\n}', 'Trait', [], ['dyn Trait for dynamic dispatch']),
    },

    /* ────────────────────────── GO ──────────────────────────────── */
    go: {
      'func':        cmd('func {{name}}({{p}} {{T}}) {{R}} {\n    {{body}}\n    return {{val}}\n}', 'Function', ['func add(a,b int) int{return a+b}'], ['multiple return values']),
      'struct_g':    cmd('type {{Name}} struct {\n    {{Field}} {{T}}\n}', 'Struct', ['type Point struct{X,Y float64}'], ['embedded structs']),
      'interface_g': cmd('type {{Name}} interface {\n    {{Method}}() {{R}}\n}', 'Interface', ['type Animal interface{Sound() string}'], ['implicit satisfaction']),
      'goroutine':   cmd('go {{func}}({{args}})', 'Goroutine', ['go fetch(url)'], ['always use sync primitive or channel']),
      'channel':     cmd('ch := make(chan {{T}}, {{buf}})\nch <- {{val}}\n{{v}} := <-ch', 'Channel', ['ch:=make(chan int,10)'], ['deadlock if unbuffered and no receiver']),
      'for_go':      cmd('for {{i}}, {{v}} := range {{slice}} {\n    {{body}}\n}', 'Range loop', ['for i,v:=range items{fmt.Println(i,v)}'], ['copy of value']),
      'error_go':    cmd('if err != nil {\n    return fmt.Errorf("{{ctx}}: %w", err)\n}', 'Error handling', [], ['errors.Is / errors.As for wrapped errors']),
      'defer':       cmd('defer {{expr}}', 'Defer (LIFO cleanup)', ['defer f.Close()'], ['evaluated arguments at defer call time']),
      'map_g':       cmd('m := map[{{K}}]{{V}}{\n    {{key}}: {{val}},\n}', 'Map literal', ['m:=map[string]int{"a":1}'], ['nil map panics on write']),
      'slice_g':     cmd('s := []{{T}}{{{vals}}}\ns = append(s, {{v}})\ns[{{lo}}:{{hi}}]', 'Slice', ['s:=[]int{1,2,3}'], ['append may reallocate']),
    },

    /* ────────────────────────── RUBY ────────────────────────────── */
    ruby: {
      'def_r':       cmd('def {{name}}({{p}})\n  {{body}}\nend', 'Method definition', ['def greet(name) "Hello #{name}" end'], ['implicit return']),
      'class_r':     cmd('class {{Name}} < {{Base}}\n  def initialize({{p}})\n    @{{field}} = {{val}}\n  end\nend', 'Class', ['class Dog < Animal; end'], ['attr_accessor']),
      'block':       cmd('{{collection}}.{{method}} do |{{x}}|\n  {{body}}\nend', 'Block / iterator', ['[1,2,3].each do |n| puts n end'], ['yield in methods']),
      'symbol':      cmd(':{{name}}', 'Symbol', [':name, :id'], ['immutable, interned strings']),
      'hash_r':      cmd('{{{key}}: {{val}}}', 'Hash', ['{name:"Alice",age:30}'], ['symbol keys preferred']),
      'module_r':    cmd('module {{Name}}\n  def {{method}}\n    {{body}}\n  end\nend', 'Module / mixin', ['module Greetable; def hi; "Hi!"; end; end'], ['include vs extend']),
    },

    /* ────────────────────────── PHP ─────────────────────────────── */
    php: {
      'function_p':  cmd('function {{name}}({{p}}): {{ret}} {\n    {{body}}\n    return {{val}};\n}', 'Function', ['function add(int $a, int $b): int { return $a+$b; }'], ['type declarations PHP 7+']),
      'class_p':     cmd('class {{Name}} extends {{Base}} {\n    public function __construct({{p}}) {}\n}', 'Class', [], ['__construct']),
      'array_p':     cmd('$arr = [{{vals}}];\n$arr[] = {{val}};\narray_push($arr, {{val}});', 'Array', ["$arr=[1,2,3];"], ['array_map, array_filter']),
      'pdo':         cmd('$pdo = new PDO("{{dsn}}", "{{user}}", "{{pw}}");\n$stmt = $pdo->prepare("{{sql}}");\n$stmt->execute([{{params}}]);', 'PDO database', [], ['prepared statements prevent SQLi']),
      'echo':        cmd('echo "{{text}}";\nprintf("{{fmt}}", {{args}});', 'Output', ['echo "Hello $name!";'], ['echo vs print']),
    },

    /* ────────────────────────── SWIFT ───────────────────────────── */
    swift: {
      'func_s':      cmd('func {{name}}({{label}} {{p}}: {{T}}) -> {{R}} {\n    {{body}}\n}', 'Function', ['func greet(name: String) -> String { "Hello \\(name)" }'], ['argument labels']),
      'struct_s':    cmd('struct {{Name}} {\n    let {{prop}}: {{T}}\n    func {{method}}() -> {{R}} { {{body}} }\n}', 'Struct (value type)', [], ['mutating func']),
      'class_s':     cmd('class {{Name}}: {{Protocol}} {\n    var {{prop}}: {{T}}\n    init({{p}}: {{T}}) { self.{{prop}} = {{p}} }\n}', 'Class (ref type)', [], ['deinit']),
      'optional_s':  cmd('var {{name}}: {{T}}?\nif let {{n}} = {{name}} { {{body}} }\n{{name}} ?? {{default}}', 'Optional', ['var x: Int? = nil'], ['force unwrap ! — avoid']),
      'enum_s':      cmd('enum {{Name}} {\n    case {{a}}\n    case {{b}}({{T}})\n}', 'Enum with assoc values', ['enum Result{case success(Data);case failure(Error)}'], ['exhaustive switch']),
      'protocol':    cmd('protocol {{Name}} {\n    func {{method}}() -> {{R}}\n}', 'Protocol', [], ['extensions provide default implementations']),
      'closure_s':   cmd('{ ({{p}}: {{T}}) -> {{R}} in\n    {{body}}\n}', 'Closure', ['let double = { (x:Int) in x*2 }'], ['trailing closure syntax']),
    },

    /* ─────────────────────── KOTLIN ─────────────────────────────── */
    kotlin: {
      'fun_k':       cmd('fun {{name}}({{p}}: {{T}}): {{R}} {\n    {{body}}\n    return {{val}}\n}', 'Function', ['fun add(a:Int,b:Int):Int = a+b'], ['single-expression']),
      'data_class':  cmd('data class {{Name}}(val {{p}}: {{T}})', 'Data class', ['data class User(val id:Int, val name:String)'], ['auto equals/hashCode/copy']),
      'object_k':    cmd('object {{Name}} {\n    fun {{method}}() { {{body}} }\n}', 'Singleton object', [], ['companion object for static']),
      'when_k':      cmd('when ({{val}}) {\n    {{a}} -> {{expr}}\n    else -> {{default}}\n}', 'When expression', ['when(x){1->"one";2->"two";else->"other"}'], ['exhaustive for sealed classes']),
      'null_safety':  cmd('{{val}}?.{{method}}()\n{{val}} ?: {{default}}', 'Null safety operators', ['name?.length ?: 0'], ['!! forces non-null assertion']),
      'coroutine_k': cmd('launch {\n    val result = async { {{expr}} }.await()\n}', 'Coroutine', [], ['CoroutineScope','Dispatchers']),
      'extension':   cmd('fun {{Type}}.{{name}}({{p}}): {{R}} {\n    {{body}}\n}', 'Extension function', ['fun String.shout()=this.toUpperCase()+"!"'], ['no access to private members']),
    },

    /* ────────────────────────── SCALA ───────────────────────────── */
    scala: {
      'def_sc':      cmd('def {{name}}({{p}}: {{T}}): {{R}} = {\n  {{body}}\n}', 'Method', ['def add(a:Int,b:Int):Int = a+b'], ['infix notation']),
      'case_class':  cmd('case class {{Name}}({{p}}: {{T}})', 'Case class', ['case class Point(x:Double,y:Double)'], ['immutable by default']),
      'match_sc':    cmd('{{val}} match {\n  case {{p1}} => {{e1}}\n  case _ => {{default}}\n}', 'Pattern match', ['x match{case 0=>"zero";case _=>"other"}'], ['exhaustive warning']),
      'option_sc':   cmd('Option({{val}}).map({{fn}}).getOrElse({{default}})', 'Option', ['Option(x).map(_*2).getOrElse(0)'], ['for-comprehension with Option']),
      'for_comp':    cmd('for {\n  {{a}} <- {{fa}}\n  {{b}} <- {{fb}}\n} yield {{expr}}', 'For-comprehension', ['for{x<-xs;y<-ys}yield x+y'], ['desugars to flatMap/map']),
      'trait_sc':    cmd('trait {{Name}} {\n  def {{method}}: {{R}}\n}', 'Trait', [], ['stackable trait pattern']),
    },

    /* ──────────────────────────── R ─────────────────────────────── */
    r: {
      'func_r':      cmd('{{name}} <- function({{p}}) {\n  {{body}}\n  return({{val}})\n}', 'Function', ['double <- function(x) x*2'], ['implicit return of last expr']),
      'vector_r':    cmd('{{name}} <- c({{vals}})', 'Atomic vector', ['x <- c(1,2,3,4,5)'], ['recycling rule']),
      'df':          cmd('df <- data.frame({{col1}}=c({{vals1}}), {{col2}}=c({{vals2}}))', 'Data frame', [], ['tibble for tidyverse']),
      'apply':       cmd('apply({{mat}}, {{margin}}, {{fn}})\nsapply({{lst}}, {{fn}})', 'Apply family', ['sapply(1:5, function(x) x^2)'], ['lapply for list output']),
      'ggplot':      cmd("ggplot({{data}}, aes(x={{x}}, y={{y}})) +\n  geom_{{type}}() +\n  labs(title='{{title}}')", 'ggplot2 visualization', [], ['library(ggplot2) required']),
      'pipe_r':      cmd('{{data}} |> {{fn1}}() |> {{fn2}}()', 'Native pipe (R 4.1+)', ['mtcars |> subset(cyl==6) |> nrow()'], ['%>% from magrittr also common']),
    },

    /* ─────────────────────── C# ─────────────────────────────────── */
    csharp: {
      'class_cs':    cmd('public class {{Name}} : {{Base}} {\n    public {{T}} {{Prop}} { get; set; }\n    public {{Name}}({{p}}) { {{body}} }\n}', 'Class', [], ['properties','access modifiers']),
      'async_cs':    cmd('public async Task<{{T}}> {{name}}Async() {\n    var result = await {{expr}};\n    return result;\n}', 'Async method', [], ['ConfigureAwait(false)']),
      'linq':        cmd('{{src}}.Where({{pred}})\n     .Select({{fn}})\n     .OrderBy({{key}})\n     .ToList()', 'LINQ query', ['nums.Where(x=>x>0).Select(x=>x*2).ToList()'], ['deferred execution']),
      'lambda_cs':   cmd('({{p}}) => {{expr}}', 'Lambda', ['list.Where(x => x > 0)'], ['captured variables']),
      'record':      cmd('public record {{Name}}({{T}} {{P}});', 'Record (C# 9+)', ['public record Point(double X, double Y);'], ['with-expression for mutation']),
      'pattern_cs':  cmd('switch ({{val}}) {\n    case {{T}} {{v}} when {{cond}}: {{body}}; break;\n    default: {{d}}; break;\n}', 'Pattern switch', [], ['switch expression (C# 8+)']),
      'nullable_cs': cmd('{{T}}? {{name}};\n{{name}}?.{{method}}();\n{{name}} ?? {{default}}', 'Nullable reference', [], ['enable nullable context']),
    },

  };
})();
window.KB_LANG = KB_LANG;



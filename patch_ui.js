import fs from 'fs';
let code = fs.readFileSync('components/AIAssistant.tsx', 'utf8');

const target = `                    {m.content}
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => playMoroVoice(m.content)}
                        className="ml-2 text-xs text-purple-400 hover:text-purple-300 inline-flex items-center"
                        title="Play Voice"
                      >
                        <i className="fa-solid fa-volume-high"></i>
                      </button>
                    )}`;

const replace = `                    {m.content}
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => playMoroVoice(m.content)}
                        className="ml-2 text-xs text-purple-400 hover:text-purple-300 inline-flex items-center"
                        title="Play Voice"
                      >
                        <i className="fa-solid fa-volume-high"></i>
                      </button>
                    )}
                    {m.groundingChunks && m.groundingChunks.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5 w-full">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                          <i className="fa-solid fa-search text-purple-400"></i> Searched Web Sources
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {m.groundingChunks.map((chunk, i) => (
                            <a
                              key={i}
                              href={chunk.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-black/40 border border-white/10 hover:border-purple-500/50 rounded px-2 py-1 text-[10px] text-slate-300 hover:text-purple-300 transition-colors"
                              title={chunk.title}
                            >
                              <i className="fa-brands fa-google text-[10px]"></i>
                              <span className="truncate max-w-[120px]">{chunk.title || new URL(chunk.uri).hostname.replace('www.', '')}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}`;

if (code.includes(target)) {
  fs.writeFileSync('components/AIAssistant.tsx', code.replace(target, replace));
  console.log("Success");
} else {
  console.log("Target not found");
}

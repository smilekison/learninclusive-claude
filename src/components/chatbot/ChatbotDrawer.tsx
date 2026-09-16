import React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGlobalShortcuts } from "@/contexts/GlobalShortcutsContext";

interface ChatMessage { role: "user" | "assistant"; content: string }

export const ChatbotDrawer: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { on } = useGlobalShortcuts();

  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const endRef = React.useRef<HTMLDivElement>(null);

  // Open on first visit
  React.useEffect(() => {
    try {
      const key = 'ils_chatbot_seen';
      const seen = localStorage.getItem(key);
      if (!seen) {
        setOpen(true);
        localStorage.setItem(key, '1');
      }
    } catch {
      // localStorage unavailable (private browsing, etc.) — first-open nudge is non-critical
    }
  }, []);

  React.useEffect(() => {
    return on("requestCloseTopOverlay", () => setOpen(false));
  }, [on]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const announce = (msg: string) => {
    const el = document.getElementById("accessibility-announcements");
    if (el) el.textContent = msg;
  };

  const speak = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("tts-speak", {
        body: { text },
      });
      if (error) throw error;
      const base64 = (data as any)?.audio as string | undefined;
      if (!base64) return;
      const audioUrl = `data:audio/mpeg;base64,${base64}`;
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {/* noop */});
    } catch (e) {
      console.error("tts error", e);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const nextHistory: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextHistory);
    setInput("");
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-generate", {
        body: {
          message: text,
          role: user?.role,
          route: window.location.pathname,
          history: nextHistory.slice(-8),
        },
      });

      if (error) throw error;
      const reply = (data as any)?.reply ?? t("chatbot.errorFallback");
      setMessages((prev) => [...prev, { role: "assistant", content: String(reply) }]);
      announce(t("chatbot.assistantReplied"));
    } catch (e: any) {
      console.error("chatbot error", e);
      setMessages((prev) => [...prev, { role: "assistant", content: t("chatbot.errorFallback") }]);
      announce(t("chatbot.errorAnnounce"));
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating launcher */}
      <div className="fixed bottom-5 right-5 z-50">
        <Button
          size="icon"
          variant="default"
          aria-label={t("chatbot.openAssistant")}
          onClick={() => setOpen(true)}
          className="rounded-full h-16 w-16 shadow-lg"
        >
          <Bot className="h-7 w-7" />
        </Button>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{/* hidden, we use the floating button */}</DrawerTrigger>
        <DrawerContent className="max-w-4xl mx-auto w-full">
          <DrawerHeader>
            <DrawerTitle>{t("chatbot.title")}</DrawerTitle>
            <DrawerDescription>{t("chatbot.subtitle")}</DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col h-[75vh]">
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-3 py-2">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("chatbot.emptyState")}</p>
                )}
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <Card className={`max-w-[85%] px-3 py-2 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
                      {m.role === "assistant" && (
                        <div className="mt-2 flex justify-end">
                          <Button size="icon" variant="ghost" aria-label={t("chatbot.speak")} onClick={() => speak(m.content)}>
                            <Volume2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </Card>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <Card className="max-w-[85%] px-3 py-2 bg-muted">
                      <div className="text-sm text-muted-foreground">{t("chatbot.typing")}</div>
                    </Card>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={t("chatbot.placeholder")}
                  aria-label={t("chatbot.inputAria")}
                />
                <Button onClick={send} disabled={sending || !input.trim()} aria-label={t("chatbot.send")}>
                  <Send className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">{t("chatbot.send")}</span>
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("chatbot.hint")}
              </p>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

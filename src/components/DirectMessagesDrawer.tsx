import React, { useState, useEffect, useRef } from "react";
import { User, DirectMessage } from "../types";
import { api, realtime } from "../services/api";
import { X, Send, Image as ImageIcon, Check, CheckCheck, Smile, Phone, Video } from "lucide-react";

interface DirectMessagesDrawerProps {
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  language: "en" | "ne";
  initialSelectedUser?: User;
}

export const DirectMessagesDrawer: React.FC<DirectMessagesDrawerProps> = ({
  currentUser,
  allUsers,
  onClose,
  language,
  initialSelectedUser,
}) => {
  const otherUsers = allUsers.filter((u) => u.id !== currentUser.id);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(
    initialSelectedUser || otherUsers[0] || allUsers[0]
  );
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [textInput, setTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync selected user if initialSelectedUser changes or not initialized
  useEffect(() => {
    if (initialSelectedUser) {
      setSelectedUser(initialSelectedUser);
    } else if (!selectedUser && allUsers.length > 0) {
      const fallback = otherUsers[0] || allUsers[0];
      if (fallback) setSelectedUser(fallback);
    }
  }, [initialSelectedUser, allUsers, otherUsers, selectedUser]);

  // Fetch messages
  useEffect(() => {
    if (!selectedUser || !currentUser) return;
    const fetchMsgs = async () => {
      setIsLoading(true);
      try {
        const res = await api.getMessages(currentUser.id, selectedUser.id);
        setMessages(res.messages || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMsgs();
  }, [currentUser?.id, selectedUser?.id]);

  // Real-time message listener
  useEffect(() => {
    const unsub = realtime.subscribe("message:sent", (newMsg: DirectMessage) => {
      if (
        (newMsg.senderId === currentUser.id && newMsg.receiverId === selectedUser?.id) ||
        (newMsg.senderId === selectedUser?.id && newMsg.receiverId === currentUser.id)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    });

    return () => unsub();
  }, [currentUser.id, selectedUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (customText?: string) => {
    const msgToSend = customText || textInput.trim();
    if (!msgToSend || !selectedUser) return;

    if (!customText) setTextInput("");

    try {
      await api.sendMessage({
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        text: msgToSend,
      });
    } catch (e) {
      console.error("Message send error", e);
    }
  };

  const nepaliQuickReplies = [
    "नमस्ते! 🙏",
    "धेरै राम्रो फोटो! 😍",
    "कहिले खिचिएको हो? 📷",
    "जय नेपाल! 🇳🇵",
    "पोखरा कहिले आउने? 🏔️",
  ];

  return (
    <div
      id="direct-messages-modal"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[700px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col sm:flex-row">
        {/* Left: Chats User List */}
        <div className="w-full sm:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#DC143C]" />
              <span>{language === "ne" ? "गफगाफ (गफ)" : "Messages"}</span>
            </div>
            <button
              onClick={onClose}
              className="sm:hidden p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {otherUsers.map((u) => {
              const isSelected = selectedUser?.id === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-50/80 border-l-4 border-[#003893]" : "hover:bg-slate-100/70"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={u.avatar}
                      alt={u.fullName}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate flex items-center justify-between">
                      <span>{u.fullName}</span>
                      <span className="text-[10px] text-slate-400 font-normal">Active</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate font-mono">@{u.username}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Chat Conversation */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2.5">
                  <img
                    src={selectedUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                    alt={selectedUser?.fullName || "User"}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-[#003893]"
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-900 leading-tight">
                      {selectedUser?.fullName || "User"}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      @{selectedUser?.username} • {selectedUser?.location}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
              <span className="text-xs text-slate-500 font-medium">Select a user to chat</span>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#003893] flex items-center justify-center mb-2">
                  <Send className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-700">Start the conversation</div>
                <div className="text-[11px]">Send a quick greeting to connect on Photo Bucket</div>
              </div>
            ) : (
              messages.map((m) => {
                const isMine = m.senderId === currentUser.id;
                return (
                  <div
                    key={m.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"} animate-in fade-in`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs ${
                        isMine
                          ? "bg-[#003893] text-white rounded-br-xs"
                          : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                      }`}
                    >
                      <div>{m.text}</div>
                      <div
                        className={`text-[9px] mt-1 text-right font-mono ${
                          isMine ? "text-blue-200" : "text-slate-400"
                        }`}
                      >
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Nepali Replies */}
          <div className="px-3 py-1.5 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-white">
            {nepaliQuickReplies.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(r)}
                className="text-[11px] font-['Mukta'] font-medium px-2.5 py-1 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-[#DC143C] text-slate-700 transition-colors flex-shrink-0 cursor-pointer"
              >
                {r}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-slate-200 flex items-center gap-2 bg-white"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Message @${selectedUser.username}...`}
              className="flex-1 text-xs px-3.5 py-2 rounded-full bg-slate-100 border border-transparent focus:border-[#003893] focus:bg-white text-slate-800 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="w-8 h-8 rounded-full bg-[#003893] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#002868] transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

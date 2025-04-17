import React from 'react';
import { ClipboardCopy, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ChatMessage = ({ message, copyMessageToClipboard, copyStatus }) => {
  const isUser = message.sender === 'user';

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      layout
    >
      <motion.div
        className={(
          "relative max-w-xl p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg",
          isUser
            ? "bg-electro-blue text-white ml-12"
            : "bg-electro-black text-electro-light mr-12 border-l-4 border-electro-blue"
        )}
        whileHover={{ scale: 1.01 }}
      >
        {!isUser && (
          <div className="absolute -left-8 top-3 rounded-full p-1 bg-electro-dark">
            <motion.div
              className="text-2xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⚡
            </motion.div>
          </div>
        )}

        <div
          className={(
            "prose break-words max-w-none",
            isUser ? "prose-invert" : "prose-electro"
          )}
          dangerouslySetInnerHTML={{ __html: message.text }}
        />

        <motion.button
          onClick={() => copyMessageToClipboard(message.text, message.id)}
          className={(
            "absolute -top-2 -right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200",
            copyStatus === message.id
              ? "bg-green-500"
              : isUser
                ? "bg-electro-blue-dark text-white"
                : "bg-electro-gray text-white"
          )}
          title="Copy message"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {copyStatus === message.id ? (
            <CheckCircle size={14} className="text-white" />
          ) : (
            <ClipboardCopy size={14} className="text-white" />
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default ChatMessage;

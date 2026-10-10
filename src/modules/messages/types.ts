import type { 
  MessageInsert, 
  MessageWithSender, 
  Conversation, 
  MessageType, 
  UserType 
} from '@/types/database';

// Re-export for consumers
export type { MessageWithSender, Conversation, MessageType, UserType, MessageInsert };

export interface MessageFormData {
  recipient_id: string;
  listing_id?: string;
  pickup_request_id?: string;
  message_text: string;
  message_type: MessageType;
  attachment_urls?: string[];
  reply_to_id?: string;
}

export interface ConversationListItemProps {
  conversation: Conversation;
  currentUserId: string;
  onClick: (conversationId: string) => void;
  onDelete?: (conversationId: string) => void;
}

export interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showAvatar: boolean;
  showTime: boolean;
  showStatus: boolean;
  onReact?: (messageId: string, emoji: string) => void;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'location' | 'voice' | 'file';
  url: string;
  name?: string;
  size?: number;
}

export interface MessageThreadOptions {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  otherUserType: UserType;
  listingId?: string;
  pickupRequestId?: string;
  onBack: () => void;
  onUserProfileClick: (userId: string) => void;
  onListingClick: (listingId: string) => void;
  onLocationClick: (lat: number, lng: number) => void;
}

export interface OfflineMessageQueue {
  id?: number;
  payload: MessageInsert;
  timestamp: number;
}
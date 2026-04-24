import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Plus, CornerUpLeft, Loader2 } from "lucide-react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { fetchCommunityPosts, CommunityPost, supabase } from "@/lib/supabase";

function cn2(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const TAB_MAPPING: Record<string, CommunityPost["post_type"] | undefined> = {
  "Discussions": "discussion",
  "Experts": "expert",
  "Success Stories": "success",
};

export default function ScreenCommunity() {
  const [activeTab, setActiveTab] = useState("Discussions");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New post modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const type = TAB_MAPPING[activeTab];
      const data = await fetchCommunityPosts(type);
      setPosts(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [activeTab]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("community_posts").insert([
        {
          id: crypto.randomUUID(),
          author_name: "Ramesh Kumar", // Mock current user
          author_role: "Potato Farmer",
          content: newPostContent.trim(),
          post_type: "discussion",
          likes: 0,
          comments: 0,
        }
      ]);
      
      if (error) throw error;
      
      setNewPostContent("");
      setIsModalOpen(false);
      loadPosts(); // Refresh list
    } catch (err) {
      alert("Failed to create post: " + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
       
       <div className="sticky top-0 z-10 bg-white px-4 pt-4 pb-2 border-b border-slate-100">
           <div className="flex bg-slate-100 rounded-full p-1 border border-slate-200">
              {["Discussions", "Experts", "Success Stories"].map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={cn2(
                     "flex-1 py-2 rounded-full text-xs font-bold transition-all",
                     activeTab === tab ? "bg-emerald-900 text-white shadow-md" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                   )}
                 >
                    {tab}
                 </button>
              ))}
           </div>
       </div>

       <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
               <Loader2 className="w-8 h-8 animate-spin" />
               <p className="text-sm font-medium">Fetching posts…</p>
             </div>
           ) : error ? (
             <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-700 text-sm font-medium">
               {error}
             </div>
           ) : posts.length === 0 ? (
             <div className="text-center py-20 text-slate-400 font-medium text-sm">
               No posts found in this category.
             </div>
           ) : (
             posts.map((post) => (
               <div key={post.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                     <div className="flex gap-3">
                        <img 
                          src={post.author_img || `https://placehold.co/100x100/1e293b/ffffff?text=${post.author_name.charAt(0)}`} 
                          alt={post.author_name} 
                          className="w-10 h-10 rounded-full border border-slate-200" 
                        />
                        <div>
                           <h4 className="font-bold text-slate-800 text-sm">{post.author_name}</h4>
                           <p className="text-[10px] text-slate-500 font-medium">{post.author_role}</p>
                        </div>
                     </div>
                     <div className="text-[10px] text-slate-400 font-medium">{getTimeAgo(post.created_at)}</div>
                  </div>
                  
                  <p className="text-slate-700 text-sm mb-4 leading-relaxed">
                     {post.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-slate-500 border-t border-slate-50 pt-3">
                     <div className="flex gap-6">
                        <button className="flex items-center gap-1.5 text-xs font-medium hover:text-emerald-600 transition">
                           <Heart className="w-4 h-4" /> {Math.round(post.likes)}
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-medium hover:text-emerald-600 transition">
                           <MessageCircle className="w-4 h-4" /> {Math.round(post.comments)}
                        </button>
                     </div>
                     <button className="flex items-center gap-1.5 text-xs font-medium hover:text-emerald-600 transition">
                        <CornerUpLeft className="w-4 h-4" /> Reply
                     </button>
                  </div>
               </div>
             ))
           )}

           {!loading && posts.length > 0 && (
             <button className="w-full text-center py-2 text-emerald-700 font-bold text-sm">
                View All {activeTab}
             </button>
           )}
           
           <div className="pb-20"></div>
       </div>

       <div className="absolute bottom-6 left-0 right-0 px-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-emerald-900 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-800 transition"
          >
             <Plus className="w-5 h-5" /> Start a Discussion
          </button>
       </div>

       {/* Simple Create Post Modal */}
       {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => !isSubmitting && setIsModalOpen(false)}
            ></div>
            <div className="bg-white rounded-3xl w-full max-w-sm relative z-10 p-6 shadow-2xl">
               <h3 className="text-lg font-bold text-slate-800 mb-4">Start a Discussion</h3>
               <textarea 
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition h-32 resize-none"
                 placeholder="Share your question or experience with other farmers..."
                 value={newPostContent}
                 onChange={(e) => setNewPostContent(e.target.value)}
                 disabled={isSubmitting}
               ></textarea>
               <div className="flex gap-3 mt-6">
                  <button 
                    className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                  >
                     Cancel
                  </button>
                  <button 
                    className="flex-[2] bg-emerald-900 text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || isSubmitting}
                  >
                     {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                     Post Discussion
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}

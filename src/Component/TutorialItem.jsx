import React from "react";

function TutorialItem({ item }) {
  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes("embed")) return url;
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1].split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1].split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };
  const embedUrl = getEmbedUrl(item.video_url);

  return (
    <article className="bg-white rounded-lg shadow-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl">
      <div className="p-5 sm:p-6">
        <h3 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-700 mb-3">
          {item.title}
        </h3>
        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
          <p>{item.content}</p>
        </div>
      </div>
      {embedUrl && (
        <div className="bg-slate-100 p-1">
          {" "}
          <div className="aspect-w-16 aspect-h-9">
            <iframe
              src={embedUrl}
              title={item.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full rounded-b-md sm:rounded-md" // Rounded corners
            ></iframe>
          </div>
        </div>
      )}
    </article>
  );
}

export default TutorialItem;

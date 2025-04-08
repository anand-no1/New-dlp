from flask import Flask, request, jsonify, send_file, render_template
from yt_dlp import YoutubeDL
import os

app = Flask(__name__, static_folder="static", template_folder="templates")
DOWNLOAD_FOLDER = "downloads"
COOKIE_FILE = "cookies.txt"
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

def get_ydl_opts(format_id=None):
    opts = {
        "cookiefile": COOKIE_FILE,
        "quiet": True,
        "noplaylist": True,
        "nocheckcertificate": True,
        "outtmpl": os.path.join(DOWNLOAD_FOLDER, "%(title)s.%(ext)s"),
        "ignoreerrors": True,
    }
    if format_id:
        opts["format"] = format_id
    return opts

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/fetch', methods=['POST'])
def fetch():
    url = request.json.get("url")
    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        with YoutubeDL(get_ydl_opts()) as ydl:
            info = ydl.extract_info(url, download=False)

        formats = [
            {
                "format_id": fmt["format_id"],
                "height": fmt.get("height"),
                "ext": fmt["ext"],
                "filesize": fmt.get("filesize"),
                "vcodec": fmt.get("vcodec"),
                "acodec": fmt.get("acodec"),
            }
            for fmt in info.get("formats", [])
            if fmt.get("height") and fmt.get("vcodec") != "none" and fmt.get("acodec") != "none"
        ]

        return jsonify({
            "title": info.get("title"),
            "thumbnail": info.get("thumbnail"),
            "formats": sorted(formats, key=lambda x: x["height"])
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/download', methods=['POST'])
def download():
    data = request.json
    url = data.get("url")
    format_id = data.get("format_id")

    if not url or not format_id:
        return jsonify({"error": "Missing URL or format_id"}), 400

    try:
        with YoutubeDL(get_ydl_opts(format_id)) as ydl:
            info = ydl.extract_info(url, download=True)
            filepath = ydl.prepare_filename(info)

        return send_file(filepath, as_attachment=True)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)

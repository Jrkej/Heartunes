from flask import Flask, render_template,request,redirect,url_for
from scrapper import *

app = Flask(__name__)

baseURL = "https://heartunes.vercel.app/"
globe = {"baseURL":baseURL}

@app.route("/")
def root():
    return redirect(url_for("home"))

@app.route("/search/<query>")
def search(query):
    query.replace('%20', '')
    response = querySearch(query)
    meta = {
        "name": query,
        "description": f"Song search : {query}",
        "playlistType": "Search",
        "owner": "Heartunes",
        "thumbnail": baseURL + "static/images/logo.png",
        "url": "https://www.youtube.com/results?search_query="+'+'.join(query.split()),
        "tracks": len(response),
        "songs": response,
        "meta": baseURL + "search/" + query,
    }
    return render_template("list.html", meta=meta, globe=globe)

@app.route("/link/<site>/<vid>")
def link(site, vid):
    if site == "youtube":
        response = youtubeLink(vid)
        return render_template("solo.html", song = response, globe=globe)
    elif site == "spotify":
        response = spotifyLink(vid)
        return render_template("solo.html", song = response, globe=globe)
    else:
        return "Invalid site link - <a href='/home'>Home.</a>"

@app.route("/playlist/<site>/<pid>")
def playlist(site, pid):
    if site == "youtube":
        response = youtubePlaylist(pid)
        response['meta'] = baseURL + "playlist/" + site + "/" + pid
        return render_template("list.html", meta=response, globe=globe)
    if site == "spotify":
        response = spotifyPlaylist(pid)
        response['meta'] = baseURL + "/playlist/" + site + "/" + pid
        return render_template("list.html", meta=response, globe=globe)
    else:
        return "Invalid site link - <a href='/home'>Home.</a>"

@app.route("/home", methods=["GET","POST"])
def home():
    if request.method == "GET":
        return render_template("index.html", globe=globe)
    else:
        query = request.form['query']
        if "https" in query:
            if "playlist" in query:
                if "youtube" in query:
                    return redirect(f"/playlist/youtube/{query.split('list=')[1].split('?')[0]}")
                if "spotify" in query:
                    return redirect(f"/playlist/spotify/{query.split('/')[-1]}")
                return "Playlist URL not supported - <a href='/home'>Home.</a>"
            
            if "youtube" in query or "youtu.be" in query:
                return redirect(f"/link/youtube/{query[-11:]}")
            elif "spotify" in query and "track" in query:
                return redirect(f"/link/spotify/{query.split('track/')[1].split('?')[0]}")

            return "Song URL not supported - <a href='/home'>Home.</a>"

        return redirect(f"/search/{query}")

@app.route("/ping", methods=["GET","POST"])
def ping():
    print(request.cookies)
    return str(request.cookies)

@app.errorhandler(404)
def not_found(link):
    return "Ummmm, Looks like a bad url take a raft to <a href='/home'>Home.</a>"

if __name__ == "__main__":
    app.run(debug=True)
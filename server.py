from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import json

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        """Handle POST requests for updating study_data.json"""
        if self.path == '/update_data':
            try:
                # Get the content length
                content_length = int(self.headers['Content-Length'])
                # Read the POST data
                post_data = self.rfile.read(content_length)
                # Parse the JSON data
                data = json.loads(post_data.decode('utf-8'))
                
                # Write the data to study_data.json
                with open('study_data.json', 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success'}).encode())
                print('Successfully updated study_data.json')
                
            except Exception as e:
                print(f"Error updating study_data.json: {str(e)}")
                self.send_error(500, f"Error updating file: {str(e)}")
        else:
            self.send_error(404, "Not found")

    def guess_type(self, path):
        """Override to set correct content type for JSON files"""
        if path.endswith('.json'):
            return 'application/json'
        return super().guess_type(path)

    def do_GET(self):
        """Handle GET requests"""
        try:
            # Get the file path
            file_path = self.translate_path(self.path)
            print(f"Requested path: {self.path}")
            print(f"Translated to: {file_path}")
            
            # If the path is a directory, serve index.html
            if os.path.isdir(file_path):
                file_path = os.path.join(file_path, 'index.html')
                print(f"Directory requested, serving: {file_path}")
            
            # Check if file exists
            if not os.path.exists(file_path):
                print(f"File not found: {file_path}")
                self.send_error(404, "File not found")
                return
            
            # Set content type
            content_type = self.guess_type(file_path)
            print(f"Content type: {content_type}")
            
            # Read file content
            with open(file_path, 'rb') as f:
                content = f.read()
                
            # For JSON files, validate the content
            if content_type == 'application/json':
                try:
                    json_data = json.loads(content)
                    print(f"Valid JSON data: {json_data}")
                except json.JSONDecodeError as e:
                    print(f"Invalid JSON in {file_path}: {str(e)}")
                    self.send_error(500, "Invalid JSON data")
                    return
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', content_type)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            print(f"Successfully served: {file_path}")
                
        except Exception as e:
            print(f"Error serving {self.path}: {str(e)}")
            self.send_error(500, f"Internal server error: {str(e)}")

port = 8000
print(f"Starting server at http://localhost:{port}")
print("Press Ctrl+C to stop the server")
HTTPServer(('localhost', port), CORSRequestHandler).serve_forever() 
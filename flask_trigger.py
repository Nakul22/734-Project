from flask import Flask, jsonify, render_template, request, send_from_directory
from flask_cors import CORS
from covidsim import Simulation
from DataCleaning import getJson
import os

# configuration
DEBUG = True

# instantiate the app
app = Flask(__name__)
app.config.from_object(__name__)

# enable CORS
CORS(app, resources={r'/*': {'origins': '*'}})

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.route('/<path:path>', methods=['GET'])
def getFile(path):
    """This function recieves a request for a file from the front end and returns the file if found in the back end,
    404 error if not found"""
    if request.method =="GET":
        return send_from_directory(os.getcwd(), filename=path)

@app.route('/create_dataset', methods=['GET'])
def trigger_dataset():
    if request.method =='GET':
        # simulation = Simulation()
        # simulation.generateDataset()
        # data = simulation.getInfections()
        # getJson()
        return send_from_directory(os.getcwd(), filename='dataJson.json')


if __name__ == '__main__':
    app.run()

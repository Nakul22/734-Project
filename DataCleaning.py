from collections import defaultdict
from datetime import datetime, timedelta
import pandas as pd
import json

def converter(o):
    if isinstance(o, datetime):
        return o.__str__()

def getJson():
    starttime = datetime(year=2020, month=1, day=1)
    risky_infections = pd.read_csv('risky_interactions.csv') #uncomment so that we use the dataframes passed instead
    test_results = pd.read_csv('test_results.csv') #uncomment so that we use the dataframes passed instead
    data = defaultdict(list)

    currtime = datetime(year=2019, month=1, day=1, hour=0)
    seen = defaultdict(lambda: defaultdict(set))
   
    #add data for each node and link from the risky_interactions file
    for index, row in risky_infections.iterrows():
        #add id's for each node to the datalist
        flag_e = False
        flag_i = False
        if row['day'] ==-1:
            continue
        
        if(datetime(year=2020, month=1, day=row['day']+1, hour=row['hour'])>currtime):
            currtime = datetime(year=2020, month=1, day=row['day']+1, hour=row['hour'])

        if row['infected'] not in seen[currtime]['infected']:
            seen[currtime]['infected'].add(row['infected'])
            person1 = {}
            person1['id'] = row['infected']
            person1['infected'] = True
            # print(row['day'])
            person1['start'] = datetime(year=2020, month=1, day=row['day']+1, hour=row['hour'])
            person1['end'] = datetime(year=2020, month=1, day=row['day']+1, hour=row['hour'], minute=15)
            data['nodes'].append(person1)
            flag_i=True

        if row['exposed'] not in seen[currtime]['exposed']:
            seen[currtime]['exposed'].add(row['exposed'])
            person2 = {}
            person2['id'] = row['exposed']
            person2['start'] = datetime(year=2020, month=1, day=row['day']+1, hour=row['hour'])
            person2['end'] = datetime(year=2020, month=1, day=row['day']+1, hour=row['hour'], minute=15)
            if row['infection_occured']:
                person2['infected'] = True
            else:
                person2['infected'] = False

            data['nodes'].append(person2)
            flag_e=True

        #add data to the links dict
        if flag_e or flag_i:
            link={}
            link['source']= row['infected']
            link['target'] = row['exposed']
            link['timestamp'] = row['hour']
            link['infection_occured'] = row['infection_occured']
            link['masked'] = row['masked']
            link['start'] = datetime(year=2020, month=1, day=row['day']+1, hour=row['hour'])
            link['end'] = datetime(year=2020, month=1, day=row['day']+1, hour=row['hour'], minute=15)
            data['links'].append(link)


    #iterate through the nodes and add data from the test results
    for index, row in test_results.iterrows():
        for index, node in enumerate(data['nodes']):
            val = node
            if node['id'] == row['user'] and node['start'].day == row['done_day'] :
                val['tested'] = True
            
            if node['id'] == row['user'] and node['start'].day == row['result_day']:
                val['test_result'] = 'positive'
                val['status'] = row['status']
            data['nodes'][index]= val

    with open('dataJson.json', 'w') as outfile:
        outfile.write(json.dumps(data, default=converter))
    # return json.dumps(data, default=converter)
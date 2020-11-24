import pandas as pd
import numpy as np
import random as rnd
from flask import Flask, jsonify
from flask_cors import CORS


def create_dataset():

    def sanitize_dataset():
        contacts = pd.read_csv(r'bt_symmetric.csv')
        contacts.columns = col_names
        in_study_contacts = contacts[contacts['b'] > 0]
        valid_contacts = in_study_contacts[in_study_contacts['rssi'] >= -75]
        valid_contacts = valid_contacts.reset_index(drop=True)
        valid_contacts.to_csv(r'valid_contacts.csv', index=False)

    class person():
        def __init__(self, id):
            self.id = id
            self.infected = False
            self.qurantined = False
            self.qurantine_day = None
            #self.testResults = []


    def day1():
        contacts_day1 = contacts[contacts['time']<86400]
        a_plus_b_day1 = contacts_day1[['a', 'b']].values.ravel('K')
        (ids , counts) = np.unique(a_plus_b_day1,return_counts=True)
        print(counts[2])
        print(ids[2])


    def day_hour(time):
        day = int(time/(24*3600))
        hour = int((time%(24*3600))/3600)
        return day, hour

    def add_test_results(testTime, test_res_time,test_recs):
        for id in ids:
            pp = people[id]
            testRecord = {
                'done_day': testTime,
                'result_day': test_res_time,
                'user': pp.id,
                'status': None
            }
            if (pp.infected):
                is_false_neg = rnd.random() < parameters['test_result_fn']
                testRecord['status'] = 'FN' if is_false_neg else 'PQ'

                # assumption
                if parameters['quarantine_enabled']:
                    #pp.qurantined = not is_false_neg
                    if(not is_false_neg):
                        pp.qurantine_day = test_res_time
                test_recs.append(testRecord)

            else:
                testRecord['status'] = 'F'

        # test_recs.append(testRecord)
        

    parameters = dict()
    parameters['mask_p'] = 0.5
    parameters['infection_p'] = 0.01
    parameters['masked_interaction_p'] = 1-((1-parameters['mask_p'])*(1-parameters['mask_p']))
    parameters['test_period'] = 10
    parameters['test_result_delay'] = 8
    parameters['test_result_fn'] = 0.10
    parameters['quarantine_enabled'] = False



    col_names = ['time', 'a', 'b', 'rssi']
   # sanitize_dataset()
    contacts = pd.read_csv(r'valid_contacts.csv')
    contacts.columns = col_names
    people = dict()


    a_plus_b = contacts[['a', 'b']].values.ravel('K')
    (ids , counts) = np.unique(a_plus_b, return_counts=True)

    rnd.seed(10)

    for id in ids:
        people[id] = person(id)

    people[12].infected = True

    i = 0

    risky_cols = ['time', 'day', 'hour', 'infected', 'exposed', 'masked', 'infection_occured']
    risky_interactions = pd.DataFrame(columns = risky_cols)

    testResults_cols = ['result_day','done_day', 'user', 'status']
    test_res_df = pd.DataFrame(columns = testResults_cols)



    record = {"time": -1,
              "day": -1,
              "hour": -1,
              "infected": -1,
              "exposed": 12,
              "masked": False,
              "infection_occured": True}

    risky_interactions = risky_interactions.append(record, ignore_index=True)
    import time

    start_time = time.time()


    records = []
    testRecords = []
    infections = 0
    nextTestingTime = parameters['test_period']-1
    for index, row in contacts.iterrows():

        t, id1, id2 = row['time'], row['a'], row['b']
        p1, p2 = people[id1], people[id2]

        d,h = day_hour(t)
        if(d>nextTestingTime):
            testTime = nextTestingTime
            test_result_time = nextTestingTime + parameters['test_result_delay']

            add_test_results(testTime, test_result_time,testRecords)
            nextTestingTime += parameters['test_period']


        if(p1.qurantine_day is not None and d>p1.qurantine_day):
            p1.qurantined = True
        if(p2.qurantine_day is not None and d>p2.qurantine_day):
            p2.qurantined = True

        if(p1.qurantined or p2.qurantined):
            continue

        if (p1.infected and p2.infected):
            continue

        elif(p1.infected or p2.infected):
            record = {"time": t,
                      "day": d,
                      "hour": h,
                      "infected": p1.id if p1.infected else p2.id,
                      "exposed": p2.id if p1.infected else p1.id,
                      "masked": False,
                      "infection_occured": False}
            is_masked = rnd.random()<parameters['masked_interaction_p']
            infection_prob = parameters['infection_p']*(0.25 if is_masked else 1)
            record['masked'] = is_masked
            if(rnd.random()<infection_prob):
                p1.infected=True
                p2.infected =True
                record['infection_occured'] = True
                infections+=1
            records.append(record)

    risky_interactions = risky_interactions.append(records, ignore_index=True)
    risky_interactions.to_csv(r'./dataset/risky_interactions.csv', index=False)
    test_res_df = test_res_df.append(testRecords, ignore_index=True)
    test_res_df.to_csv(r'./dataset/test_results.csv', index=False)
    print(infections+1)

    heatmap_data=risky_interactions.copy()

    heatmap_data = heatmap_data[['day', 'hour', 'infection_occured']]
    a = heatmap_data[heatmap_data["infection_occured"] == True].groupby(["day", "hour"])['day']
    a.count().to_csv(r'./dataset/heatmap.csv', index=True)


    daily_cases=risky_interactions.copy()

    daily_cases = daily_cases[['day', 'hour' ,'infection_occured']]
    b = daily_cases[daily_cases["infection_occured"] == True].groupby(["day"])
    bb = b[['day','infection_occured']].count()
    bb.to_csv(r'./dataset/daily.csv', index=True)
    bb.cumsum().to_csv(r'./dataset/daily_cum.csv', index=True)

    print("--- %s seconds ---" % (time.time() - start_time))

# create_dataset()


# configuration
DEBUG = True

# instantiate the app
app = Flask(__name__)
app.config.from_object(__name__)

# enable CORS
CORS(app, resources={r'/*': {'origins': '*'}})


# sanity check route
@app.route('/ping', methods=['GET'])
def ping_pong():
    return jsonify('pong!')

@app.route('/create_dataset', methods=['GET'])
def trigger_dataset():
    create_dataset()
    return jsonify('Success!')


if __name__ == '__main__':
    app.run()

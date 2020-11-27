import pandas as pd
import numpy as np
import random as rnd

class Simulation():
    """This class handles the generation of datafiles that will be used for the visualizations presented to the user on the frontend"""
    def __init__(self, parameters=None):
        """Initializes the simulation. If no parameters are passed default values are passed for the parameters
        Mask_p: probability that someone in an interaction will use a mask
        infection_p: infection probability (percentatge)
        masked_interaction_p: propability that an interaction will be masked
        test_period: 
        test_result_delay:
        test_result_fn:
        quarantine_enabled: if users are forced to quarantine or not"""
        if (parameters):
            self.parameters = parameters
        else:
            #set default parameters if none passed in the constructor
            self.parameters = dict()
            self.parameters['mask_p'] = 0.5
            self.parameters['infection_p'] = 0.01
            self.parameters['masked_interaction_p'] = 1-((1-self.parameters['mask_p'])*(1-self.parameters['mask_p']))
            self.parameters['test_period'] = 10
            self.parameters['test_result_delay'] = 8
            self.parameters['test_result_fn'] = 0.10
            self.parameters['quarantine_enabled'] = False
    
    def sanitize_dataset(self):
        self.contacts = pd.read_csv(r'bt_symmetric.csv')
        self.contacts.columns = col_names
        in_study_contacts = self.contacts[contacts['b'] > 0]
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


    def day1(self):
        contacts_day1 = self.contacts[self.contacts['time']<86400]
        a_plus_b_day1 = contacts_day1[['a', 'b']].values.ravel('K')
        (self.add_test_resultsids , counts) = np.unique(a_plus_b_day1,return_counts=True)
        print(counts[2])
        print(self.ids[2])


    def day_hour(self, time):
        day = int(time/(24*3600))
        hour = int((time%(24*3600))/3600)
        return day, hour

    def add_test_results(self, testTime, test_res_time,test_recs):
        for id in self.ids:
            pp = self.people[id]
            testRecord = {
                'done_day': testTime,
                'result_day': test_res_time,
                'user': pp.id,
                'status': None
            }
            if (pp.infected):
                is_false_neg = rnd.random() < self.parameters['test_result_fn']
                testRecord['status'] = 'FN' if is_false_neg else 'PQ'

                # assumption
                if self.parameters['quarantine_enabled']:
                    #pp.qurantined = not is_false_neg
                    if(not is_false_neg):
                        pp.qurantine_day = test_res_time
                test_recs.append(testRecord)

            else:
                testRecord['status'] = 'F'

        # test_recs.append(testRecord)

    def generateDataset(self):
        col_names = ['time', 'a', 'b', 'rssi']
        # sanitize_dataset()
        self.contacts = pd.read_csv(r'valid_contacts.csv')
        self.contacts.columns = col_names
        self.people = dict()


        a_plus_b = self.contacts[['a', 'b']].values.ravel('K')
        (self.ids , counts) = np.unique(a_plus_b, return_counts=True)

        rnd.seed(10)

        for id in self.ids:
            self.people[id] = self.person(id)

        self.people[12].infected = True

        i = 0

        risky_cols = ['time', 'day', 'hour', 'infected', 'exposed', 'masked', 'infection_occured']
        self.risky_interactions = pd.DataFrame(columns = risky_cols)

        testResults_cols = ['result_day','done_day', 'user', 'status']
        self.test_res_df = pd.DataFrame(columns = testResults_cols)



        record = {"time": -1,
                "day": -1,
                "hour": -1,
                "infected": -1,
                "exposed": 12,
                "masked": False,
                "infection_occured": True}

        self.risky_interactions = self.risky_interactions.append(record, ignore_index=True)
        import time

        start_time = time.time()


        records = []
        testRecords = []
        infections = 0
        nextTestingTime = self.parameters['test_period']-1
        for index, row in self.contacts.iterrows():

            t, id1, id2 = row['time'], row['a'], row['b']
            p1, p2 = self.people[id1], self.people[id2]

            d,h = self.day_hour(t)
            if(d>nextTestingTime):
                testTime = nextTestingTime
                test_result_time = nextTestingTime + self.parameters['test_result_delay']

                self.add_test_results(testTime, test_result_time,testRecords)
                nextTestingTime += self.parameters['test_period']


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
                is_masked = rnd.random()<self.parameters['masked_interaction_p']
                infection_prob = self.parameters['infection_p']*(0.25 if is_masked else 1)
                record['masked'] = is_masked
                if(rnd.random()<infection_prob):
                    p1.infected=True
                    p2.infected =True
                    record['infection_occured'] = True
                    infections+=1
                records.append(record)

        self.risky_interactions = self.risky_interactions.append(records, ignore_index=True)
        self.risky_interactions.to_csv(r'risky_interactions.csv', index=False)
        self.test_res_df = self.test_res_df.append(testRecords, ignore_index=True)
        self.test_res_df.to_csv(r'test_results.csv', index=False)
        print(infections+1)

        heatmap_data=self.risky_interactions.copy()

        heatmap_data = heatmap_data[['day', 'hour', 'infection_occured']]
        a = heatmap_data[heatmap_data["infection_occured"] == True].groupby(["day", "hour"])['day']
        a.count().to_csv(r'heatmap.csv', index=True)


        daily_cases=self.risky_interactions.copy()

        daily_cases = daily_cases[['day', 'hour' ,'infection_occured']]
        b = daily_cases[daily_cases["infection_occured"] == True].groupby(["day"])
        bb = b[['day','infection_occured']].count()
        bb.to_csv(r'daily.csv', index=True)
        bb.cumsum().to_csv(r'daily_cum.csv', index=True)

        print("--- %s seconds ---" % (time.time() - start_time))

    def getInfections(self):
        return {'risky_interactions': self.risky_interactions, 'test_results': self.test_res_df}
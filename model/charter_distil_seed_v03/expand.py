#!/usr/bin/env python3
"""Reproducibly build independent train and holdout schema families."""
import json, random
from pathlib import Path
ROOT=Path(__file__).parent
# Specs: column name:type, then recommended chart(s) using column names.
# Chart: chartTypeId, x name, y name or None, aggregation, subjective score.
TRAIN = [
 ('Airline operations','flight_date:d route:c delay_minutes:n flight_duration_minutes:n passengers:n aircraft_id:c',[(4,'delay_minutes',None,None,.93),(5,'route','delay_minutes',None,.87),(2,'flight_date','passengers','sum',.81)]),
 ('Library circulation','checkout_date:d genre:c patron_id:c loan_days:n overdue_days:n branch:c',[(5,'genre','loan_days',None,.9),(4,'overdue_days',None,None,.85),(1,'branch','overdue_days','avg',.78)]),
 ('Water treatment','sample_date:d plant:c turbidity_ntu:n ph_level:n chlorine_mg_l:n sample_id:c',[(3,'turbidity_ntu','chlorine_mg_l',None,.92),(5,'plant','ph_level',None,.86),(4,'turbidity_ntu',None,None,.81)]),
 ('Cybersecurity events','event_date:d severity:c source:c response_seconds:n alert_id:c',[(5,'severity','response_seconds',None,.91),(4,'response_seconds',None,None,.86),(6,'severity','source','count',.78)]),
 ('Museum attendance','visit_date:d exhibit:c ticket_price:n visit_duration_min:n age_group:c',[(5,'exhibit','visit_duration_min',None,.9),(1,'age_group','ticket_price','avg',.82),(4,'visit_duration_min',None,None,.78)]),
 ('Forest ecology','observation_date:d species:c plot:c tree_height_m:n canopy_cover_pct:n tree_id:c',[(5,'species','tree_height_m',None,.92),(3,'tree_height_m','canopy_cover_pct',None,.86),(4,'tree_height_m',None,None,.8)]),
 ('Microbiology cultures','incubation_date:d strain:c growth_rate:n temperature_c:n replicate:c',[(3,'temperature_c','growth_rate',None,.93),(5,'strain','growth_rate',None,.86),(4,'growth_rate',None,None,.78)]),
 ('Marine shipping','arrival_date:d port:c vessel_id:c container_count:n turnaround_hours:n',[(5,'port','turnaround_hours',None,.92),(3,'container_count','turnaround_hours',None,.85),(4,'turnaround_hours',None,None,.77)]),
 ('Call center quality','call_date:d team:c agent_id:c wait_seconds:n satisfaction_score:n resolution_minutes:n',[(3,'wait_seconds','satisfaction_score',None,.92),(5,'team','resolution_minutes',None,.86),(4,'wait_seconds',None,None,.78)]),
 ('EV charging stations','session_date:d connector_type:c station:c energy_kwh:n charging_minutes:n session_id:c',[(3,'energy_kwh','charging_minutes',None,.93),(5,'connector_type','charging_minutes',None,.87),(1,'station','energy_kwh','sum',.77)]),
 ('Clinical trial measurements','visit_date:d arm:c patient_id:c biomarker_value:n blood_pressure:n',[(5,'arm','biomarker_value',None,.93),(3,'biomarker_value','blood_pressure',None,.84),(4,'biomarker_value',None,None,.78)]),
 ('Public parking','entry_date:d facility:c duration_hours:n paid_amount:n permit_type:c plate_number:c',[(3,'duration_hours','paid_amount',None,.9),(5,'facility','duration_hours',None,.85),(1,'permit_type','paid_amount','avg',.79)]),
 ('Agricultural commodity auction','sale_date:d commodity:c market:c price_per_kg:n lot_weight_kg:n sale_id:c',[(3,'lot_weight_kg','price_per_kg',None,.9),(5,'commodity','price_per_kg',None,.85),(4,'price_per_kg',None,None,.79)]),
 ('Warehouse refrigeration','timestamp:d chamber:c ambient_temp_c:n internal_temp_c:n compressor_runtime_min:n',[(3,'ambient_temp_c','internal_temp_c',None,.94),(5,'chamber','internal_temp_c',None,.85),(4,'compressor_runtime_min',None,None,.76)]),
 ('Epidemiology surveillance','report_date:d district:c age_band:c case_count:n test_positivity_rate:n',[(1,'district','case_count','sum',.91),(2,'report_date','case_count','sum',.87),(5,'age_band','test_positivity_rate',None,.78)]),
 ('Hotel bookings','checkin_date:d room_type:c booking_channel:c nights:n nightly_rate:n booking_id:c',[(5,'room_type','nightly_rate',None,.92),(3,'nights','nightly_rate',None,.85),(4,'nights',None,None,.79)]),
 ('Food safety inspections','inspection_date:d facility_type:c violation_count:n inspection_score:n inspector_id:c',[(3,'violation_count','inspection_score',None,.91),(5,'facility_type','inspection_score',None,.85),(4,'violation_count',None,None,.78)]),
 ('Urban noise survey','measurement_date:d neighborhood:c decibel_level:n traffic_volume:n monitor_id:c',[(3,'traffic_volume','decibel_level',None,.94),(5,'neighborhood','decibel_level',None,.86),(4,'decibel_level',None,None,.78)]),
 ('Semiconductor testing','test_date:d wafer_batch:c die_id:c leakage_current:n frequency_mhz:n yield_pct:n',[(3,'leakage_current','frequency_mhz',None,.94),(5,'wafer_batch','yield_pct',None,.86),(4,'leakage_current',None,None,.8)]),
 ('Wildlife rehabilitation','intake_date:d injury_category:c species:c recovery_days:n animal_id:c weight_kg:n',[(5,'injury_category','recovery_days',None,.92),(3,'weight_kg','recovery_days',None,.84),(4,'recovery_days',None,None,.78)]),
 ('Telecommunications quality','test_date:d tower_zone:c latency_ms:n packet_loss_pct:n download_mbps:n device_id:c',[(3,'latency_ms','download_mbps',None,.92),(5,'tower_zone','packet_loss_pct',None,.86),(4,'latency_ms',None,None,.77)]),
 ('Consumer product returns','return_date:d reason:c category:c days_to_return:n refund_amount:n return_id:c',[(5,'reason','days_to_return',None,.91),(1,'category','refund_amount','sum',.84),(4,'refund_amount',None,None,.78)]),
 ('Archaeological excavation','excavation_date:d site:c layer:c artifact_depth_cm:n artifact_weight_g:n artifact_id:c',[(3,'artifact_depth_cm','artifact_weight_g',None,.91),(5,'site','artifact_depth_cm',None,.85),(4,'artifact_weight_g',None,None,.79)]),
 ('Renewable grid balancing','interval_start:d grid_region:c wind_output_mw:n demand_mw:n solar_output_mw:n',[(3,'wind_output_mw','demand_mw',None,.93),(3,'solar_output_mw','demand_mw',None,.86),(5,'grid_region','wind_output_mw',None,.78)]),
 ('Subway reliability','service_date:d line:c station:c headway_minutes:n dwell_seconds:n vehicle_id:c',[(5,'line','headway_minutes',None,.93),(3,'headway_minutes','dwell_seconds',None,.85),(4,'dwell_seconds',None,None,.78)]),
]
HOLDOUT=[
 ('Veterinary diagnostics','visit_date:d species:c clinic:c lab_value:n temperature_c:n case_id:c',[(5,'species','lab_value',None,.92),(3,'temperature_c','lab_value',None,.84)]),
 ('Oceanographic buoys','reading_date:d buoy_zone:c salinity_psu:n ocean_temp_c:n dissolved_oxygen:n buoy_id:c',[(3,'salinity_psu','ocean_temp_c',None,.91),(3,'ocean_temp_c','dissolved_oxygen',None,.85)]),
 ('Legal case processing','filing_date:d court:c case_type:c resolution_days:n matter_id:c',[(5,'case_type','resolution_days',None,.92),(5,'court','resolution_days',None,.85)]),
 ('Sports injury rehab','session_date:d rehab_program:c participant_id:c mobility_score:n session_minutes:n',[(3,'session_minutes','mobility_score',None,.91),(5,'rehab_program','mobility_score',None,.84)]),
 ('Geothermal wells','sample_date:d well_field:c fluid_temp_c:n flow_lpm:n pressure_bar:n well_id:c',[(3,'pressure_bar','flow_lpm',None,.92),(5,'well_field','fluid_temp_c',None,.84)]),
 ('Customer support translation','request_date:d language_pair:c translation_minutes:n text_length_words:n request_id:c',[(3,'text_length_words','translation_minutes',None,.93),(5,'language_pair','translation_minutes',None,.84)]),
 ('Satellite observation','capture_date:d orbit_class:c cloud_cover_pct:n image_resolution_m:n image_id:c',[(3,'cloud_cover_pct','image_resolution_m',None,.9),(5,'orbit_class','cloud_cover_pct',None,.84)]),
 ('Railway bridge inspection','inspection_date:d bridge_type:c corrosion_score:n crack_width_mm:n bridge_id:c',[(3,'corrosion_score','crack_width_mm',None,.91),(5,'bridge_type','crack_width_mm',None,.84)]),
 ('Postal sorting performance','sort_date:d facility:c parcel_weight_kg:n sorting_seconds:n package_id:c',[(3,'parcel_weight_kg','sorting_seconds',None,.93),(5,'facility','sorting_seconds',None,.83)]),
 ('Aquaculture','sampling_date:d tank:c fish_weight_g:n feed_amount_g:n dissolved_oxygen:n',[(3,'feed_amount_g','fish_weight_g',None,.9),(5,'tank','fish_weight_g',None,.85)]),
 ('Art restoration','treatment_date:d material:c artwork_id:c surface_damage_pct:n treatment_hours:n',[(3,'surface_damage_pct','treatment_hours',None,.91),(5,'material','treatment_hours',None,.85)]),
 ('Experimental physics','observation_date:d apparatus:c voltage_v:n current_a:n resistance_ohm:n trial_id:c',[(3,'voltage_v','current_a',None,.93),(5,'apparatus','resistance_ohm',None,.84)]),
 ('All identifier payload','record_id:c token_id:c checksum:c',[]),
 ('No variance lab readings','measurement_date:d device:c temperature_c:n pressure_kpa:n',[]),
]

def render(family, spec, variant, partition):
    seed=2209+sum(map(ord,family))*7+variant*101
    rng=random.Random(seed)
    fields=[]
    for entry in spec.split():
        name,typ=entry.split(':');fields.append((name,{'c':'categorical','d':'date','n':'numeric'}[typ]))
    rng.shuffle(fields)
    ids={name:i for i,(name,_) in enumerate(fields)}
    row_count=rng.choice([120,300,950,3600,12000])
    columns=[]
    for i,(name,typ) in enumerate(fields):
        distinct = (1 if family=='No variance lab readings' else rng.randint(3,9) if typ=='categorical' and name not in ('record_id','token_id','checksum') else rng.randint(12,100) if typ=='date' else None)
        if typ=='categorical' and any(x in name for x in ['_id','checksum','plate_number','package_id']): distinct=min(row_count,int(row_count*.97))
        c={'id':i,'name':name,'type':typ,'nullCount':rng.choice([0,0,0,2,7,19])}
        if distinct is not None:c['distinctCount']=distinct
        columns.append(c)
    if family=='No variance lab readings':
        for c in columns: c['distinctCount']=1
    charts=[]
    for j,(t,x,y,a,score) in enumerate(variant and list(reversed(specs)) or specs):
        charts.append({'chartTypeId':t,'x':ids[x],'y':ids[y] if y else None,'aggregation':a,'score':round(score-j*.012,3)})
    charts.sort(key=lambda c:-c['score'])
    meta={'dataset':f'{family} — {partition} scenario {variant+1}','rowCount':row_count,'columns':columns}
    return {'messages':[{'role':'user','content':'Generate and rank useful charts for this dataset metadata. Return JSON only.\n'+json.dumps(meta,separators=(',',':'))},{'role':'assistant','content':json.dumps({'charts':charts},separators=(',',':'))}]}

if __name__=='__main__':
    for name,groups,variants in [('train.jsonl',TRAIN,4),('test.jsonl',HOLDOUT,3)]:
        with (ROOT/name).open('a') as f:
            for family,spec,specs in groups:
                for v in range(variants):
                    item=render(family,spec,v,'train' if name=='train.jsonl' else 'holdout')
                    f.write(json.dumps(item,separators=(',',':'))+'\n')
    print('Added',len(TRAIN)*4,'training schemas and',len(HOLDOUT)*3,'held-out schemas')

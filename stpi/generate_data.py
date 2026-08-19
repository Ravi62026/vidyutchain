#!/usr/bin/env python3
"""
Electricity Meter Data Generator (Hybrid Real-World Baseline & Anomaly Injection)
Author: Antigravity AI
Project: STPI Theft Detection System
"""

import os
import zipfile
import urllib.request
import ssl
import random
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Set seeds for reproducibility
np.random.seed(42)
random.seed(42)

# Bypass SSL certificate verification for macOS Python environment
ssl._create_default_https_context = ssl._create_unverified_context

# Set style for premium visualizations
sns.set_theme(style="whitegrid")
plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['Arial', 'Inter', 'DejaVu Sans'],
    'figure.titlesize': 16,
    'axes.titlesize': 14,
    'axes.labelsize': 12,
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'legend.fontsize': 10
})

# UCI Dataset Details
UCI_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00235/household_power_consumption.zip"
ZIP_FILE = "household_power_consumption.zip"
TXT_FILE = "household_power_consumption.txt"

# 20 Meter Profiles representing different consumers
METER_PROFILES = [
    {"meter_id": f"M{i:03d}", "solar": (i % 3 == 0), "house_type": ["Small", "Medium", "Large", "Luxury"][i % 4]}
    for i in range(1, 21)
]

# ---------------------------------------------------------
# 1. DOWNLOAD AND EXTRACT UCI DATASET
# ---------------------------------------------------------

def download_and_extract():
    """Download and extract the UCI dataset if not already present."""
    if not os.path.exists(TXT_FILE):
        if not os.path.exists(ZIP_FILE):
            print("Downloading UCI Household Power Consumption dataset (~20MB)...")
            print(f"URL: {UCI_URL}")
            urllib.request.urlretrieve(UCI_URL, ZIP_FILE)
            print("Download completed successfully!")
        
        print("Extracting ZIP file...")
        with zipfile.ZipFile(ZIP_FILE, 'r') as zip_ref:
            zip_ref.extractall(".")
        print("Extraction completed!")
    else:
        print("UCI Dataset text file already exists. Skipping download.")

# ---------------------------------------------------------
# 2. LOAD AND PROCESS BASELINE REAL-WORLD DATA
# ---------------------------------------------------------

def load_and_resample_uci() -> pd.DataFrame:
    """Load a subset of UCI data, clean it, and resample to 15-minute intervals."""
    print("Loading UCI dataset subset...")
    
    # Read 160,000 rows to ensure we get >10,000 15-minute intervals after filtering
    df_raw = pd.read_csv(TXT_FILE, sep=';', nrows=160000, 
                         na_values=['?'], low_memory=False)
    
    # Drop rows with NaN to ensure continuous clean baseline before resampling
    df_raw = df_raw.dropna().copy()
    
    print("Formatting timestamps and resampling to 15-minute intervals...")
    # Combine Date and Time
    df_raw['timestamp'] = pd.to_datetime(df_raw['Date'] + ' ' + df_raw['Time'], format='%d/%m/%Y %H:%M:%S')
    df_raw = df_raw.set_index('timestamp')
    
    # Resample to 15-minute intervals
    resample_dict = {
        'Global_active_power': 'mean',
        'Global_intensity': 'mean',
        'Voltage': 'mean'
    }
    df_resampled = df_raw.resample('15min').agg(resample_dict)
    df_resampled = df_resampled.dropna().reset_index()
    
    return df_resampled

def construct_hybrid_base(df_resampled: pd.DataFrame) -> pd.DataFrame:
    """Map UCI resampled data into 20 unique meters of 500 records each."""
    print("Constructing hybrid baseline for 20 meters...")
    records = []
    required_intervals = 500
    
    for idx, meter in enumerate(METER_PROFILES):
        meter_id = meter["meter_id"]
        solar_equipped = meter["solar"]
        house_type = meter["house_type"]
        
        # Get a slice of 500 records from the resampled dataframe
        start_idx = idx * required_intervals
        end_idx = start_idx + required_intervals
        meter_slice = df_resampled.iloc[start_idx:end_idx].copy()
        
        for _, row in meter_slice.iterrows():
            ts = row['timestamp']
            voltage = row['Voltage']
            power = row['Global_active_power'] # in kW
            current = row['Global_intensity'] # in A
            
            # 15-minute consumption (kWh) = Active Power (kW) * 0.25 hours
            consumption_kwh = power * 0.25
            
            # Back-calculate or estimate Power Factor (PF)
            if current > 0.1 and voltage > 50:
                pf = (power * 1000.0) / (voltage * current)
                pf = np.clip(pf, 0.70, 0.98)
            else:
                pf = 0.90
            
            # Determine season
            month = ts.month
            if 3 <= month <= 6:
                season = "Summer"
            elif 7 <= month <= 9:
                season = "Monsoon"
            elif month == 10:
                season = "Spring"
            else:
                season = "Winter"
                
            day_name = ts.day_name()
            hour = ts.hour
            
            # Assign metadata based on house type
            family_size = {"Small": 2, "Medium": 4, "Large": 5, "Luxury": 6}[house_type]
            work_schedule = {"Small": "Office-going", "Medium": "WFH", "Large": "Mixed", "Luxury": "Mixed"}[house_type]
            daily_avg = {"Small": 2.0, "Medium": 5.0, "Large": 8.0, "Luxury": 14.0}[house_type]
            
            records.append({
                "meter_id": meter_id,
                "timestamp": ts,
                "voltage": voltage,
                "current": current,
                "power": power,
                "power_factor": pf,
                "consumption_kwh": consumption_kwh,
                "is_anomaly": 0,
                "anomaly_type": "NORMAL",
                "day_of_week": day_name,
                "hour": hour,
                "season": season,
                "house_type": house_type,
                "family_size": family_size,
                "work_schedule": work_schedule,
                "solar_equipped": solar_equipped,
                "daily_avg": daily_avg
            })
            
    return pd.DataFrame(records)

# ---------------------------------------------------------
# 3. ANOMALY INJECTION LOGIC
# ---------------------------------------------------------

def inject_anomalies(df: pd.DataFrame) -> pd.DataFrame:
    """Inject anomalies according to specified classes and realistic schedules."""
    df = df.sort_values(by=["meter_id", "timestamp"]).reset_index(drop=True)
    
    for meter_id in df["meter_id"].unique():
        meter_mask = df["meter_id"] == meter_id
        meter_indices = df[meter_mask].index.tolist()
        solar = df.loc[meter_indices[0], "solar_equipped"]
        
        # Target: 30 anomalous records per meter (6% of 500 records)
        if solar:
            anomaly_counts = {
                "LOAD_THEFT": 7,
                "METER_TAMPERING": 7,
                "REVERSE_ENERGY": 11,
                "COMMUNICATION_FAILURE": 5
            }
        else:
            anomaly_counts = {
                "LOAD_THEFT": 8,
                "METER_TAMPERING": 9,
                "REVERSE_ENERGY": 5,
                "COMMUNICATION_FAILURE": 8
            }
            
        used_indices = set()
        
        # --- Class 4: Communication Failure (NaN Bursts) ---
        cf_count = anomaly_counts["COMMUNICATION_FAILURE"]
        start_offset = random.randint(50, 420)
        cf_indices = [meter_indices[start_offset + i] for i in range(cf_count)]
        for idx in cf_indices:
            df.at[idx, "voltage"] = np.nan
            df.at[idx, "current"] = np.nan
            df.at[idx, "power"] = np.nan
            df.at[idx, "power_factor"] = np.nan
            df.at[idx, "consumption_kwh"] = np.nan
            df.at[idx, "is_anomaly"] = 1
            df.at[idx, "anomaly_type"] = "COMMUNICATION_FAILURE"
            used_indices.add(idx)
            
        # Candidates filter helper
        def get_candidates(hour_list):
            candidates = []
            for idx in meter_indices:
                if idx in used_indices:
                    continue
                row_hour = df.at[idx, "hour"]
                if row_hour in hour_list:
                    candidates.append(idx)
            return candidates

        # --- Class 1: Load Theft (90-98% drop) ---
        lt_hours = [22, 23, 0, 1, 2, 3, 4, 5]
        lt_candidates = get_candidates(lt_hours)
        lt_selected = random.sample(lt_candidates, min(len(lt_candidates), anomaly_counts["LOAD_THEFT"]))
        for idx in lt_selected:
            df.at[idx, "consumption_kwh"] = df.at[idx, "consumption_kwh"] * np.random.uniform(0.02, 0.10)
            df.at[idx, "power"] = df.at[idx, "consumption_kwh"] / 0.25
            v = df.at[idx, "voltage"]
            pf = df.at[idx, "power_factor"]
            df.at[idx, "current"] = (df.at[idx, "power"] * 1000.0) / (v * pf)
            df.at[idx, "is_anomaly"] = 1
            df.at[idx, "anomaly_type"] = "LOAD_THEFT"
            used_indices.add(idx)

        # --- Class 2: Meter Tampering ---
        mt_hours = [9, 10, 11, 12, 13, 14, 15, 16, 17]
        mt_candidates = get_candidates(mt_hours)
        mt_selected = random.sample(mt_candidates, min(len(mt_candidates), anomaly_counts["METER_TAMPERING"]))
        for idx in mt_selected:
            tamper_type = random.choice(["extreme_voltage", "current_spike"])
            if tamper_type == "extreme_voltage":
                df.at[idx, "voltage"] = random.choice([np.random.uniform(80.0, 130.0), np.random.uniform(285.0, 310.0)])
                p = (df.at[idx, "voltage"] * df.at[idx, "current"] * df.at[idx, "power_factor"]) / 1000.0
                df.at[idx, "power"] = p
                df.at[idx, "consumption_kwh"] = p * 0.25
            else:
                df.at[idx, "current"] = np.random.uniform(55.0, 75.0)
                p = (df.at[idx, "voltage"] * df.at[idx, "current"] * df.at[idx, "power_factor"]) / 1000.0
                df.at[idx, "power"] = p
                df.at[idx, "consumption_kwh"] = p * 0.25
            df.at[idx, "is_anomaly"] = 1
            df.at[idx, "anomaly_type"] = "METER_TAMPERING"
            used_indices.add(idx)

        # --- Class 3: Reverse Energy (Solar/backfeeding) ---
        re_hours = [10, 11, 12, 13, 14, 15, 16]
        re_candidates = get_candidates(re_hours)
        if not solar:
            re_candidates = [idx for idx in meter_indices if idx not in used_indices]
        re_selected = random.sample(re_candidates, min(len(re_candidates), anomaly_counts["REVERSE_ENERGY"]))
        for idx in re_selected:
            df.at[idx, "power"] = np.random.uniform(-4.0, -1.0)
            df.at[idx, "consumption_kwh"] = df.at[idx, "power"] * 0.25
            df.at[idx, "current"] = abs(df.at[idx, "power"] * 1000.0) / (df.at[idx, "voltage"] * df.at[idx, "power_factor"])
            df.at[idx, "is_anomaly"] = 1
            df.at[idx, "anomaly_type"] = "REVERSE_ENERGY"
            used_indices.add(idx)
            
    return df

# ---------------------------------------------------------
# 4. FEATURE ENGINEERING
# ---------------------------------------------------------

def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    """Compute rolling averages and relative features."""
    df = df.sort_values(by=["meter_id", "timestamp"]).reset_index(drop=True)
    df['date'] = df['timestamp'].dt.date
    df['daily_avg_consumption'] = df.groupby(['meter_id', 'date'])['consumption_kwh'].transform('mean')
    df['hourly_avg_consumption'] = df.groupby(['meter_id', 'hour'])['consumption_kwh'].transform('mean')
    df['consumption_ratio'] = df['consumption_kwh'] / df['daily_avg_consumption']
    df['consumption_ratio'] = df['consumption_ratio'].fillna(0.0).replace([np.inf, -np.inf], 0.0)
    
    window_24h = 96
    df['rolling_mean_24h'] = df.groupby('meter_id')['consumption_kwh'].transform(
        lambda x: x.rolling(window=window_24h, min_periods=1).mean()
    )
    df['rolling_std_24h'] = df.groupby('meter_id')['consumption_kwh'].transform(
        lambda x: x.rolling(window=window_24h, min_periods=1).std()
    ).fillna(0.0)
    
    df = df.drop(columns=['date'])
    return df

# ---------------------------------------------------------
# 5. RANDOM MISSING VALUE INJECTION (0.5%)
# ---------------------------------------------------------

def inject_random_missingness(df: pd.DataFrame) -> pd.DataFrame:
    """Inject 0.5% missing values (NaN) to normal readings for simulation realism."""
    normal_indices = df[df["is_anomaly"] == 0].index.tolist()
    num_to_null = int(len(normal_indices) * 0.005)
    null_indices = random.sample(normal_indices, num_to_null)
    cols_to_null = ["voltage", "current", "power", "power_factor", "consumption_kwh"]
    for idx in null_indices:
        if random.random() < 0.8:
            for col in cols_to_null:
                df.at[idx, col] = np.nan
        else:
            df.at[idx, random.choice(cols_to_null)] = np.nan
    return df

# ---------------------------------------------------------
# 6. VISUALIZATIONS GENERATION
# ---------------------------------------------------------

def generate_visualizations(df: pd.DataFrame):
    """Generate and save the 6 required visualization charts."""
    print("Generating visualizations...")
    colors = {
        "NORMAL": "#3182bd",
        "LOAD_THEFT": "#de2d26",
        "METER_TAMPERING": "#e6550d",
        "REVERSE_ENERGY": "#756bb1",
        "COMMUNICATION_FAILURE": "#636363"
    }
    
    # Chart A: Time Series Plot (Normal vs Anomaly)
    plt.figure(figsize=(14, 6))
    sample_meter = "M007"
    meter_df = df[df["meter_id"] == sample_meter].sort_values(by="timestamp").copy()
    plt.plot(meter_df["timestamp"], meter_df["consumption_kwh"], label="Normal Consumption", color="#3182bd", alpha=0.8, linewidth=1.5)
    
    anomaly_df = meter_df[meter_df["is_anomaly"] == 1]
    for anom_type, color in colors.items():
        sub_df = anomaly_df[anomaly_df["anomaly_type"] == anom_type]
        y_vals = sub_df["consumption_kwh"].fillna(0.0)
        plt.scatter(sub_df["timestamp"], y_vals, label=anom_type, color=color, s=50, edgecolors='black', zorder=5)
        
    plt.title(f"Consumption & Anomaly Timeline for Meter {sample_meter} (UCI-Derived Baseline)", fontsize=14, fontweight='bold', pad=15)
    plt.xlabel("Timestamp", labelpad=10)
    plt.ylabel("Consumption (kWh)", labelpad=10)
    plt.legend(loc="upper right", frameon=True, facecolor="white", edgecolor="none")
    plt.tight_layout()
    plt.savefig("anomaly_ts_plot.png", dpi=150)
    plt.close()
    print("Saved 'anomaly_ts_plot.png'")
    
    # Chart B: Heatmap of Consumption
    plt.figure(figsize=(10, 6))
    clean_df = df[(df["is_anomaly"] == 0) & (df["consumption_kwh"].notna())].copy()
    day_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    clean_df["day_of_week"] = pd.Categorical(clean_df["day_of_week"], categories=day_order, ordered=True)
    pivot_df = clean_df.pivot_table(index="day_of_week", columns="hour", values="consumption_kwh", aggfunc="mean")
    sns.heatmap(pivot_df, cmap="YlGnBu", cbar_kws={'label': 'Mean Consumption (kWh)'})
    plt.title("Heatmap of Normal Electricity Consumption (Real Baseline)", fontsize=14, fontweight='bold', pad=15)
    plt.xlabel("Hour of Day (0-23)", labelpad=10)
    plt.ylabel("Day of Week", labelpad=10)
    plt.tight_layout()
    plt.savefig("consumption_heatmap.png", dpi=150)
    plt.close()
    print("Saved 'consumption_heatmap.png'")
    
    # Chart C: Class Distribution
    plt.figure(figsize=(9, 6))
    class_counts = df["anomaly_type"].value_counts().reset_index()
    class_counts.columns = ["Class", "Count"]
    order = ["NORMAL", "LOAD_THEFT", "METER_TAMPERING", "REVERSE_ENERGY", "COMMUNICATION_FAILURE"]
    class_counts = class_counts.set_index("Class").reindex(order).reset_index()
    bar_colors = [colors[cl] for cl in order]
    bars = plt.bar(class_counts["Class"], class_counts["Count"], color=bar_colors, edgecolor="black", alpha=0.9, width=0.6)
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2.0, height + 100, f'{int(height)}', ha='center', va='bottom', fontweight='semibold')
    plt.title("Distribution of Consumer Behavior & Anomaly Classes", fontsize=14, fontweight='bold', pad=15)
    plt.xlabel("Behavioral/Anomaly Class", labelpad=10)
    plt.ylabel("Record Count", labelpad=10)
    plt.xticks(rotation=15)
    plt.ylim(0, max(class_counts["Count"]) * 1.12)
    plt.tight_layout()
    plt.savefig("class_distribution.png", dpi=150)
    plt.close()
    print("Saved 'class_distribution.png'")

    # Chart D: Voltage vs Current Scatter
    plt.figure(figsize=(10, 6.5))
    df_scatter = df.dropna(subset=["voltage", "current"]).copy()
    sns.scatterplot(data=df_scatter, x="voltage", y="current", hue="anomaly_type", palette=colors, alpha=0.6, s=40, edgecolor="none")
    plt.title("Voltage vs. Current Profile by Class", fontsize=14, fontweight='bold', pad=15)
    plt.xlabel("Voltage (V)", labelpad=10)
    plt.ylabel("Current (A)", labelpad=10)
    plt.xlim(70, 330)
    plt.ylim(-2, 80)
    plt.legend(title="Class", frameon=True, facecolor="white", edgecolor="none")
    plt.tight_layout()
    plt.savefig("voltage_vs_current.png", dpi=150)
    plt.close()
    print("Saved 'voltage_vs_current.png'")

    # Chart E: Power Factor vs Active Power
    plt.figure(figsize=(10, 6.5))
    sns.scatterplot(data=df_scatter, x="power", y="power_factor", hue="anomaly_type", palette=colors, alpha=0.6, s=40, edgecolor="none")
    plt.title("Power Factor vs. Active Power Profile by Class", fontsize=14, fontweight='bold', pad=15)
    plt.xlabel("Active Power (kW)", labelpad=10)
    plt.ylabel("Power Factor", labelpad=10)
    plt.xlim(-5, 18)
    plt.ylim(0.65, 1.02)
    plt.legend(title="Class", frameon=True, facecolor="white", edgecolor="none")
    plt.tight_layout()
    plt.savefig("pf_vs_power.png", dpi=150)
    plt.close()
    print("Saved 'pf_vs_power.png'")

    # Chart F: Hourly Consumption Boxplot by House Type
    plt.figure(figsize=(12, 6.5))
    normal_df = df[(df["anomaly_type"] == "NORMAL") & (df["consumption_kwh"].notna())].copy()
    house_order = ["Small", "Medium", "Large", "Luxury"]
    normal_df["house_type"] = pd.Categorical(normal_df["house_type"], categories=house_order, ordered=True)
    sns.boxplot(data=normal_df, x="hour", y="consumption_kwh", hue="house_type", palette="viridis", fliersize=1, linewidth=1)
    plt.title("Normal Hourly Consumption Distribution by House Type (Real Baseline)", fontsize=14, fontweight='bold', pad=15)
    plt.xlabel("Hour of Day (0-23)", labelpad=10)
    plt.ylabel("Consumption per 15-Min (kWh)", labelpad=10)
    plt.legend(title="House Type", frameon=True, facecolor="white", edgecolor="none")
    plt.tight_layout()
    plt.savefig("hourly_consumption_boxplot.png", dpi=150)
    plt.close()
    print("Saved 'hourly_consumption_boxplot.png'")

# ---------------------------------------------------------
# MAIN PROGRAM
# ---------------------------------------------------------

def main():
    # 1. Download and extract
    download_and_extract()
    
    # 2. Resample UCI data
    df_raw = pd.read_csv(TXT_FILE, sep=';', nrows=160000, 
                         na_values=['?'], low_memory=False)
    df_raw = df_raw.dropna().copy()
    df_raw['timestamp'] = pd.to_datetime(df_raw['Date'] + ' ' + df_raw['Time'], format='%d/%m/%Y %H:%M:%S')
    df_raw = df_raw.set_index('timestamp')
    df_resampled = df_raw.resample('15min').agg({
        'Global_active_power': 'mean',
        'Global_intensity': 'mean',
        'Voltage': 'mean'
    }).dropna().reset_index()
    
    # 3. Create baseline
    df = construct_hybrid_base(df_resampled)
    
    # 4. Inject anomalies
    df = inject_anomalies(df)
    
    # 5. Feature Engineering
    df = feature_engineering(df)
    
    # 6. Inject 0.5% missingness
    df = inject_random_missingness(df)
    
    # Arrange columns
    ordered_cols = [
        "meter_id", "timestamp", "voltage", "current", "power", "power_factor", 
        "consumption_kwh", "is_anomaly", "anomaly_type", "day_of_week", "hour", 
        "season", "house_type", "family_size", "work_schedule", "solar_equipped",
        "daily_avg", "daily_avg_consumption", "hourly_avg_consumption", 
        "consumption_ratio", "rolling_mean_24h", "rolling_std_24h"
    ]
    df = df[ordered_cols]
    
    # Save final CSV output
    output_filename = "meter_data_6months_20meters.csv"
    df.to_csv(output_filename, index=False)
    print(f"\nSuccessfully generated and saved dataset to '{output_filename}'")
    
    # Print statistics
    total_records = len(df)
    print(f"Total Records : {total_records}")
    print(f"Unique Meters : {df['meter_id'].nunique()}")
    print("\n--- Class Distribution ---")
    counts = df["anomaly_type"].value_counts()
    pcts = df["anomaly_type"].value_counts(normalize=True) * 100
    for name in counts.index:
        print(f"  {name:<25} : {counts[name]:>5} ({pcts[name]:.2f}%)")
        
    # Generate Visualizations
    generate_visualizations(df)
    print("\nAll artifacts created successfully!")

if __name__ == "__main__":
    main()

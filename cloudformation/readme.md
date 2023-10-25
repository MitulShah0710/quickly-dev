
# Quickly

## AWS Resources covered in this setup
- VPC
- Private Subnet
- Public Subnet
- Security Group
- IAM Role
- RDS database
- RDS Proxy
- RDSDB Parameter Group
- Secrets Manager

## Deployment

```
aws cloudformation deploy \
     --template-file quickly-vpc-rds-proxy.yml \
     --stack-name quickly-dev-test-cli \
     --capabilities CAPABILITY_IAM  \
     --profile <AWS CLI PROFILE NAME> \
     --region <REGION> \
     --parameter-overrides \
       EnvironmentName=development \
       VpcBlock=20.30.0.0/16 \
       PublicSubnet1Block=20.30.1.0/24 \
       PublicSubnet2Block=20.30.2.0/24 \
       PrivateSubnet1Block=20.30.10.0/24 \
       PrivateSubnet2Block=20.30.20.0/24 \
       Engine=12.8 \
       DBInstanceClass=db.t3.medium \
       DBAllocatedStorage=5 \
       MultiAZDatabase=false \
       TcpPort=5432 \
       PreferredBackupWindow=17:00-19:00 \
       PreferredMaintenanceWindow=Sun:19:00-Sun:23:00 \
       DBName=quickly \
       DBMasterUser=quickly \
       DBMasterPassword=quickly123
```
Note: Replace  <AWS CLI PROFILE NAME> and <REGION>

## Variables
- EnvironmentName:
  - Stack Environment name (Allowed values: development, staging, production)
- VpcBlock:
  - VPC CIDR Blick Range ( (default 20.30.0.0/16)
- PublicSubnet1Block:
  - Public Subnet CIDR Blick Range  (default 20.30.1.0/24)
- PublicSubnet2Block:
  - Public Subnet CIDR Blick Range  (default 20.30.2.0/24)
- PrivateSubnet1Block:
  - Private Subnet CIDR Blick Range  (default 20.30.10.0/24)
- PrivateSubnet2Block:
  - Private Subnet CIDR Blick Range  (default 20.30.20.0/24)
- Engine:
  - Database Engine version (Allowed values: 11.13, 12.8, 13.4)
- DBInstanceClass:
  - Database Instance vlass 
  - (Allowed values: db.t3.medium, db.t4g.medium, db.t4g.large, db.r5.large, db.r5.xlarge, db.r5.2xlarge, db.r5.4xlarge, db.r5.8xlarge, db.r5.12xlarge, db.r5.16xlarge, db.r5.24xlarge, db.r6g.large, db.r6g.xlarge, db.r6g.2xlarge, db.r6g.4xlarge, db.r6g.8xlarge, db.r6g.12xlarge, db.r6g.16xlarge, db.x2g.large, db.x2g.xlarge, db.x2g.2xlarge, db.x2g.4xlarge, db.x2g.8xlarge, db.x2g.12xlarge, db.x2g.16xlarge)
- DBAllocatedStorage:
  - Database storage allocation  (default 5 (GB))
- MultiAZDatabase:
  - If you want to configura multiAZ (default false)
- TcpPort:
  - Database port  (default 5432)
- PreferredBackupWindow:
  - Backup window  (default 17:00-19:00)
- PreferredMaintenanceWindow:
  - Maintenance window  (default Sun:19:00-Sun:23:00)
- DBName:
  - Database Name  (default quickly)
- DBMasterUser:
  - Database User name  (default quickly)
- DBMasterPassword:
  - Database Password  (default quickly123)
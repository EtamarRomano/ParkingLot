#!/bin/bash
# debug
# set -o xtrace


KEY_NAME="cloud-lot-`date +'%N'`"
KEY_PEM="$KEY_NAME.pem"

#Creating New Role and Instance Profile
ROLE_NAME="ParkingLotRole"
DYNAMO_DB_ACCESS_POLICY="arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
INSTANCE_PROFILE="ParkingLotProfile"

echo "creating role - $ROLE_NAME for ec2"
aws iam create-role --role-name $ROLE_NAME --description "role to allow access to dynamodb" --assume-role-policy-document file://ec2-role-trust-policy.json
aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn  $DYNAMO_DB_ACCESS_POLICY
aws iam create-instance-profile --instance-profile-name $INSTANCE_PROFILE
aws iam add-role-to-instance-profile --role-name $ROLE_NAME --instance-profile-name $INSTANCE_PROFILE   

#Creating .pem file
echo "create key pair $KEY_PEM to connect to instances and save locally"
aws ec2 create-key-pair --key-name $KEY_NAME \
 | jq -r ".KeyMaterial" > $KEY_PEM #Diffrent 

# secure the key pair
chmod 400 $KEY_PEM

#Creating Sec group
SEC_GRP="cl-sg-`date +'%N'`"

echo "setup firewall $SEC_GRP"
aws ec2 create-security-group   \
    --group-name $SEC_GRP       \
    --description "Access my instances" 

# figure out my ip
MY_IP=$(curl ipinfo.io/ip)
echo "My IP: $MY_IP"


echo "setup rule allowing SSH access to $MY_IP only"
aws ec2 authorize-security-group-ingress        \
    --group-name $SEC_GRP --port 22 --protocol tcp \
    --cidr $MY_IP/32

echo "setup rule allowing HTTP (port 3000) access to $MY_IP only"
aws ec2 authorize-security-group-ingress        \
    --group-name $SEC_GRP --port 3000 --protocol tcp \
    --cidr $MY_IP/32


#Creating EC2
UBUNTU_AMI="ami-00399ec92321828f5"

echo "Creating Ubuntu instance"
RUN_INSTANCES=$(aws ec2 run-instances   \
    --image-id $UBUNTU_AMI        \
    --instance-type t2.micro            \
    --key-name $KEY_NAME                \
    --iam-instance-profile Name=$INSTANCE_PROFILE    \
    --security-groups $SEC_GRP)

INSTANCE_ID=$(echo $RUN_INSTANCES | jq -r '.Instances[0].InstanceId')

echo "Waiting for instance creation..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

PUBLIC_IP=$(aws ec2 describe-instances  --instance-ids $INSTANCE_ID | 
    jq -r '.Reservations[0].Instances[0].PublicIpAddress'
)

echo "Created new instance $INSTANCE_ID @ $PUBLIC_IP"

#Creating DynamoDB Table
TABLE_NAME="PatkingLotDynamo"
echo "creating dynamoDB instance"
aws dynamodb create-table \
    --table-name $TABLE_NAME \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
--provisioned-throughput \
        ReadCapacityUnits=10,WriteCapacityUnits=5

#Setup enviorment
echo "setup production environment"
ssh -i $KEY_PEM -o "StrictHostKeyChecking=no" -o "ConnectionAttempts=10" ec2-user@$PUBLIC_IP <<EOF
    # update
    sudo yum update -y

    # install git
    sudo yum install git -y

    # install nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash

    # activate nvm
    . ~/.nvm/nvm.sh

    # install node
    nvm install node

    # get app from github
    git clone https://github.com/EtamarRomano/ParkingLot.git

    # install dependencies
    cd ParkingLot
    npm i

    # run app
    nohup npm start --host 0.0.0.0  &>/dev/null &
    exit
EOF

echo "test that it all worked"
curl  --retry-connrefused --retry 10 --retry-delay 1  http://$PUBLIC_IP:3000/

#printf "\nCLOUDLOT API IS NOW RUNNING :-) \n 
 #       The API exposes the following endpoints: \n 
  #      POST $PUBLIC_IP/entry?plate=<license-plate>&parkingLot=<parking-lot-id> \n 
   #     POST $PUBLIC_IP/exit?ticketId=<ticket-id> \n \n 
    #    ENJOY"

exit
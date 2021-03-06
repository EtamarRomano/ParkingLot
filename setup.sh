#!/bin/bash
# debug
# set -o xtrace


KEY_NAME="cloud-lot-`date +'%N'`"
KEY_PEM="$KEY_NAME.pem"


#Creating New Role and Instance Profile

ROLE_NAME="ParkingLotRole"
DYNAMO_DB_FULL_ACCESS_POLICY_ARN="arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
INSTANCE_PROFILE="ParkingLotProfile"



echo "creating role - $ROLE_NAME"
aws iam create-role --role-name $ROLE_NAME --description "role allowing access to dynamodb" --assume-role-policy-document file://ec2-role-trust-policy.json
aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn  $DYNAMO_DB_FULL_ACCESS_POLICY_ARN
aws iam create-instance-profile --instance-profile-name $INSTANCE_PROFILE
aws iam add-role-to-instance-profile --role-name $ROLE_NAME --instance-profile-name $INSTANCE_PROFILE   


#Creating .pem file
echo "create key pair $KEY_PEM to connect to instances and save locally"
aws ec2 create-key-pair --key-name $KEY_NAME --query "KeyMaterial" --output text > $KEY_PEM 


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


#Creating DynamoDB Table
TABLE_NAME="ParkingTicket"

echo "creating dynamoDB table"
aws dynamodb create-table \
    --table-name $TABLE_NAME \
    --attribute-definitions \
        AttributeName=TicketID,AttributeType=S \
    --key-schema \
        AttributeName=TicketID,KeyType=HASH \
--provisioned-throughput \
        ReadCapacityUnits=10,WriteCapacityUnits=5


#CREATE EC2 
UBUNTU_AMI="ami-05d72852800cbf29e"

echo "Creating Ubuntu instance with ami -> $UBUNTU_AMI..."
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

#Setup enviorment
echo "setup production environment on instance"
ssh -i $KEY_PEM -o "StrictHostKeyChecking=no" -o "ConnectionAttempts=10" ec2-user@$PUBLIC_IP <<EOF
    sudo yum update -y
    # install git
    sudo yum install git -y

    # install nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
    . ~/.nvm/nvm.sh

    # install node
    nvm install node

    # get app from github
    git clone https://github.com/EtamarRomano/ParkingLot.git
    cd ParkingLot
    npm install

    # run app
    nohup npm start --host 0.0.0.0  &>/dev/null &
    exit
EOF

echo "test that it all worked"
curl  --retry-connrefused --retry 10 --retry-delay 5  http://$PUBLIC_IP:3000/

printf "The app is now running at $PUBLIC_IP"

exit
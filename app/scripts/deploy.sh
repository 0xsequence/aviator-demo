npm run build

aws s3 sync build s3://aviator.taylanpince.com/ \
    --profile=hipo \
    --acl=public-read

aws cloudfront create-invalidation \
    --profile=hipo \
    --distribution-id E39F2A4DIA3GO4 \
    --paths "/*"
